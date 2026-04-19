import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import nunjucks from "nunjucks";

const normalize = (value) => value.trim().replace(/\r\n/g, "\n") + "\n";

export function createRenderer(rootDir) {
  const templatesDir = resolve(rootDir, "templates");
  const env = nunjucks.configure(templatesDir, {
    autoescape: false,
    lstripBlocks: true,
    trimBlocks: true
  });

  env.addFilter("joinList", (items, separator = ", ") => items.join(separator));

  return {
    render(templateName, viewModel) {
      return normalize(env.render(templateName, viewModel));
    }
  };
}

export async function readExistingFileIfAny(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

