import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { stat } from "node:fs/promises";

import { loadProfile, createViewModel } from "./lib/profile-data.mjs";
import { createRenderer, readExistingFileIfAny } from "./lib/render.mjs";
import { loadLucideIcons } from "./lib/ui-assets.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");

async function assertUpToDate(filePath, expected) {
  const current = await readExistingFileIfAny(filePath);

  if (current !== expected) {
    throw new Error(`Generated file is out of date: ${filePath}`);
  }
}

async function assertPdfExists(filePath) {
  const details = await stat(filePath);
  if (details.size === 0) {
    throw new Error(`Generated PDF is empty: ${filePath}`);
  }
}

async function main() {
  const profile = await loadProfile(rootDir);
  const viewModel = createViewModel(profile);
  const uiIcons = await loadLucideIcons(rootDir, [
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
  ]);
  const renderer = createRenderer(rootDir);
  const renderModel = {
    ...viewModel,
    ui_icons: uiIcons
  };

  await assertUpToDate(
    resolve(rootDir, "README.md"),
    renderer.render("readme.njk", renderModel)
  );
  await assertUpToDate(
    resolve(distDir, "index.html"),
    renderer.render("site.njk", renderModel)
  );
  await assertUpToDate(
    resolve(distDir, "resume/index.html"),
    renderer.render("resume.njk", renderModel)
  );
  await assertPdfExists(resolve(distDir, "Aleksei-Orlov-Resume.pdf"));

  console.log("Profile content is valid and generated files are fresh.");
}

await main();
