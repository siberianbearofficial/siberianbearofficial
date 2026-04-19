import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { chromium } from "playwright";

import { loadProfile, createViewModel } from "./lib/profile-data.mjs";
import { createRenderer } from "./lib/render.mjs";
import { startStaticServer } from "./lib/static-server.mjs";
import { loadLucideIcons } from "./lib/ui-assets.mjs";

const execFileAsync = promisify(execFile);
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const assetsDir = resolve(distDir, "assets");
const resumeDir = resolve(distDir, "resume");
const isWindows = process.platform === "win32";
const tailwindBinary = resolve(
  rootDir,
  "node_modules",
  ".bin",
  isWindows ? "tailwindcss.cmd" : "tailwindcss"
);

async function ensureDirectories() {
  await mkdir(assetsDir, { recursive: true });
  await mkdir(resumeDir, { recursive: true });
}

async function copyPublicAssets() {
  try {
    await cp(resolve(rootDir, "public"), distDir, {
      recursive: true,
      force: true
    });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

function collectSiteIconNames(profile) {
  return [
    "book-open",
    "download",
    "file-image",
    "github",
    "globe",
    "mail",
    "monitor",
    "moon",
    "rocket",
    "send",
    "sparkles",
    "sun",
    "tool-case",
    ...profile.value_props.map((item) => item.icon),
    ...profile.case_studies.map((item) => item.icon),
    ...profile.selected_public_repos.map((item) => item.icon)
  ];
}

async function renderOutputs({ resumeOnly = false } = {}) {
  const profile = await loadProfile(rootDir);
  const viewModel = createViewModel(profile);
  const uiIcons = await loadLucideIcons(rootDir, collectSiteIconNames(profile));
  const renderer = createRenderer(rootDir);
  const renderModel = {
    ...viewModel,
    ui_icons: uiIcons
  };

  if (!resumeOnly) {
    await writeFile(resolve(rootDir, "README.md"), renderer.render("readme.njk", renderModel));
    await writeFile(resolve(distDir, "index.html"), renderer.render("site.njk", renderModel));
  }

  await writeFile(resolve(resumeDir, "index.html"), renderer.render("resume.njk", renderModel));
}

async function compileTailwind() {
  await execFileAsync(tailwindBinary, [
    "-i",
    resolve(rootDir, "src/styles.css"),
    "-o",
    resolve(assetsDir, "site.css"),
    "--minify"
  ]);
}

async function exportResumePdf() {
  const server = await startStaticServer(distDir, 0);
  const browser = await chromium.launch({ headless: true });

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 4173;
    const page = await browser.newPage();
    await page.emulateMedia({ media: "print" });
    await page.goto(`http://127.0.0.1:${port}/resume/`, {
      waitUntil: "networkidle"
    });
    await page.pdf({
      path: resolve(distDir, "Aleksei-Orlov-Resume.pdf"),
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });
  } finally {
    await browser.close();
    await new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }

        resolvePromise();
      });
    });
  }
}

async function main() {
  const resumeOnly = process.argv.includes("--resume-only");

  if (!resumeOnly) {
    await rm(distDir, { recursive: true, force: true });
  }

  await ensureDirectories();
  await copyPublicAssets();
  await renderOutputs({ resumeOnly });
  await compileTailwind();
  await exportResumePdf();
}

await main();
