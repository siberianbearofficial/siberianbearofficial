import { cp, mkdir, rm, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { chromium } from "playwright";

import { LOCALES } from "./lib/i18n.mjs";
import { PAGES, RESUME_PDFS } from "./lib/routes.mjs";
import { renderSiteFiles } from "./lib/site-build.mjs";
import { startStaticServer } from "./lib/static-server.mjs";

const execFileAsync = promisify(execFile);
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const assetsDir = resolve(distDir, "assets");
// Spawning the .cmd shim breaks on Windows under Node 22, and quoting it
// through a shell breaks on paths with spaces. Running the CLI's JS entry
// with the current Node binary avoids both and behaves the same in Docker.
const tailwindCli = resolve(rootDir, "node_modules", "tailwindcss", "lib", "cli.js");

async function writeDistFile(relativePath, contents) {
  const target = resolve(distDir, relativePath);

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
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

async function compileTailwind() {
  await execFileAsync(process.execPath, [
    tailwindCli,
    "-i",
    resolve(rootDir, "src/styles.css"),
    "-o",
    resolve(assetsDir, "site.css"),
    "--minify"
  ]);
}

async function withBrowserOnDist(run) {
  const server = await startStaticServer(distDir, 0);
  const browser = await chromium.launch({ headless: true });

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 4173;

    await run({ browser, origin: `http://127.0.0.1:${port}` });
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

async function exportResumePdfs({ browser, origin }) {
  for (const locale of LOCALES) {
    const page = await browser.newPage();

    await page.emulateMedia({ media: "print" });
    await page.goto(`${origin}${PAGES.resume.paths[locale]}`, {
      waitUntil: "networkidle"
    });
    await page.pdf({
      path: resolve(distDir, RESUME_PDFS[locale].replace(/^\//, "")),
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
    await page.close();
  }
}

// The OG cards are rendered as ordinary pages and screenshotted, so they stay
// in the same template language as the rest of the site and pick up content
// changes automatically instead of being redrawn by hand.
async function exportOgImages({ browser, origin }, ogPages) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  for (const ogPage of ogPages) {
    const sourcePath = `og/${ogPage.name}.html`;

    await page.goto(`${origin}/${sourcePath}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: resolve(distDir, ogPage.output.replace(/^\//, "")),
      type: "png"
    });
    await unlink(resolve(distDir, sourcePath));
  }

  await page.close();
}

async function main() {
  const resumeOnly = process.argv.includes("--resume-only");
  const { files, readme, ogPages } = await renderSiteFiles(rootDir);

  if (!resumeOnly) {
    await rm(distDir, { recursive: true, force: true });
  }

  await mkdir(assetsDir, { recursive: true });
  await copyPublicAssets();

  for (const [relativePath, contents] of files) {
    if (resumeOnly && !Object.values(PAGES.resume.outputs).includes(relativePath)) {
      continue;
    }

    await writeDistFile(relativePath, contents);
  }

  if (!resumeOnly) {
    await writeFile(resolve(rootDir, "README.md"), readme);

    for (const ogPage of ogPages) {
      await writeDistFile(`og/${ogPage.name}.html`, ogPage.html);
    }
  }

  await compileTailwind();

  await withBrowserOnDist(async (session) => {
    if (!resumeOnly) {
      await exportOgImages(session, ogPages);
    }

    await exportResumePdfs(session);
  });
}

await main();
