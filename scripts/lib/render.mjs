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

  // Autoescape is off for this environment, so anything that ends up inside a
  // <script> block has to close its own escape hatch: "</script>" in a string
  // would otherwise end the block early.
  env.addFilter("json", (value) =>
    JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
  );

  env.addFilter("attr", (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  );

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

