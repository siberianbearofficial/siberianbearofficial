import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { stat } from "node:fs/promises";

import {
  loadProfile,
  loadServices,
  createViewModel,
  createServicesViewModel
} from "./lib/profile-data.mjs";
import { createRenderer, readExistingFileIfAny } from "./lib/render.mjs";
import {
  collectServicesIconNames,
  collectSiteIconNames,
  loadLucideIcons
} from "./lib/ui-assets.mjs";

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
  const services = await loadServices(rootDir);
  const viewModel = createViewModel(profile);
  const uiIcons = await loadLucideIcons(rootDir, collectSiteIconNames(profile));
  const renderer = createRenderer(rootDir);
  const renderModel = {
    ...viewModel,
    ui_icons: uiIcons
  };
  const servicesModel = {
    ...createServicesViewModel(services, profile),
    ui_icons: await loadLucideIcons(rootDir, collectServicesIconNames(services))
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
  await assertUpToDate(
    resolve(distDir, "services/index.html"),
    renderer.render("services.njk", servicesModel)
  );
  await assertPdfExists(resolve(distDir, "Aleksei-Orlov-Resume.pdf"));

  console.log("Profile and services content is valid and generated files are fresh.");
}

await main();
