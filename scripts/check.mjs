import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { stat } from "node:fs/promises";

import { readExistingFileIfAny } from "./lib/render.mjs";
import { OG_IMAGES, RESUME_PDFS } from "./lib/routes.mjs";
import { renderSiteFiles } from "./lib/site-build.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");

async function assertUpToDate(filePath, expected) {
  const current = await readExistingFileIfAny(filePath);

  if (current !== expected) {
    throw new Error(`Generated file is out of date: ${filePath}`);
  }
}

async function assertNonEmptyFile(filePath) {
  const details = await stat(filePath);

  if (details.size === 0) {
    throw new Error(`Generated file is empty: ${filePath}`);
  }
}

async function main() {
  const { files, readme } = await renderSiteFiles(rootDir);

  await assertUpToDate(resolve(rootDir, "README.md"), readme);

  for (const [relativePath, contents] of files) {
    await assertUpToDate(resolve(distDir, relativePath), contents);
  }

  for (const pdf of Object.values(RESUME_PDFS)) {
    await assertNonEmptyFile(resolve(distDir, pdf.replace(/^\//, "")));
  }

  for (const variants of Object.values(OG_IMAGES)) {
    for (const image of Object.values(variants)) {
      await assertNonEmptyFile(resolve(distDir, image.replace(/^\//, "")));
    }
  }

  console.log(
    `Content is valid and ${files.size + 1} generated files are fresh in both languages.`
  );
}

await main();
