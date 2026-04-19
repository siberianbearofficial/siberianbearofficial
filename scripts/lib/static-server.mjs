import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

async function resolveFile(rootDir, urlPathname) {
  const cleanPath = normalize(decodeURIComponent(urlPathname)).replace(/^(\.\.[/\\])+/, "");
  const fullPath = resolve(rootDir, `.${cleanPath}`);

  if (!fullPath.startsWith(resolve(rootDir))) {
    throw new Error("Forbidden path");
  }

  try {
    const details = await stat(fullPath);
    if (details.isDirectory()) {
      return join(fullPath, "index.html");
    }

    return fullPath;
  } catch {
    return join(fullPath, "index.html");
  }
}

export async function startStaticServer(rootDir, port) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const filePath = await resolveFile(rootDir, url.pathname);
      const details = await stat(filePath);

      if (!details.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const contentType = contentTypes[extname(filePath)] ?? "application/octet-stream";
      res.writeHead(200, {
        "Content-Length": details.size,
        "Content-Type": contentType
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  await new Promise((resolvePromise) => {
    server.listen(port, "127.0.0.1", resolvePromise);
  });

  return server;
}

