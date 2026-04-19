import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

import { startStaticServer } from "./lib/static-server.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");

async function main() {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Build failed with exit code ${code}`));
    });
  });

  const port = 4173;
  const server = await startStaticServer(distDir, port);
  console.log(`Preview server is running at http://127.0.0.1:${port}`);
  console.log("Press Ctrl+C to stop.");

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

await main();

