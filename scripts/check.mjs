import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { stat } from "node:fs/promises";

import { artifactPaths, assertArtifactsFresh, computeFingerprint } from "./lib/artifacts.mjs";
import { readExistingFileIfAny } from "./lib/render.mjs";
import { renderSiteFiles } from "./lib/site-build.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const publicDir = resolve(rootDir, "public");

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
  const { files, readme, ogPages } = await renderSiteFiles(rootDir);

  await assertUpToDate(resolve(rootDir, "README.md"), readme);

  for (const [relativePath, contents] of files) {
    await assertUpToDate(resolve(distDir, relativePath), contents);
  }

  for (const artifact of artifactPaths()) {
    await assertNonEmptyFile(resolve(publicDir, artifact.replace(/^\//, "")));
  }

  await assertArtifactsFresh(rootDir, await computeFingerprint(rootDir, { files, ogPages }));

  console.log(
    `Content is valid, ${files.size + 1} generated files are fresh in both languages, and the committed PDFs and OG images match.`
  );
}

await main();
