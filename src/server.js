import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeSchedule, simulateRebalance } from "./domain/analyzer.js";
import { createDemoSchedule, todayISO } from "./demo.js";

const SOURCE_DIRECTORY = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_PUBLIC_DIRECTORY = normalize(join(SOURCE_DIRECTORY, "..", "public"));
const MAX_BODY_BYTES = 1_000_000;

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const healthState = {
  requestCount: 0,
  startedAt: Date.now(),
};

function writeResponse(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, { ...SECURITY_HEADERS, ...headers });
  response.end(body);
}

function writeJson(response, statusCode, value) {
  writeResponse(response, statusCode, JSON.stringify(value), {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("The request body exceeds the 1 MB limit.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("The request body is not valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function assertSchedulePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    const error = new Error("Send an object containing tasks and weekly available hours.");
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(payload.tasks)) {
    const error = new Error("The 'tasks' field must be an array.");
    error.statusCode = 400;
    throw error;
  }
  if (payload.tasks.length > 500) {
    const error = new Error("A single analysis is limited to 500 tasks.");
    error.statusCode = 400;
    throw error;
  }
  const hours = Number(payload.weeklyAvailableHours);
  if (!Number.isFinite(hours) || hours < 1 || hours > 168) {
    const error = new Error("Weekly available hours must be between 1 and 168.");
    error.statusCode = 400;
    throw error;
  }
}

function assertJsonContentType(request) {
  const contentType = request.headers["content-type"] ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    const error = new Error("This endpoint accepts application/json requests only.");
    error.statusCode = 415;
    throw error;
  }
}

async function serveStatic(response, pathname, publicDirectory, method) {
  const requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const absolutePath = normalize(join(publicDirectory, requestedPath));
  const pathWithinPublic = relative(publicDirectory, absolutePath);

  if (pathWithinPublic.startsWith("..") || pathWithinPublic.includes(":")) {
    writeJson(response, 403, { error: "Access denied." });
    return;
  }

  try {
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    const content = method === "HEAD" ? "" : await readFile(absolutePath);
    writeResponse(response, 200, content, {
      "Cache-Control": requestedPath === "index.html" ? "no-cache" : "public, max-age=3600",
      "Content-Length": method === "HEAD" ? fileStat.size : Buffer.byteLength(content),
      "Content-Type":
        MIME_TYPES.get(extname(absolutePath).toLowerCase()) ?? "application/octet-stream",
    });
  } catch {
    writeJson(response, 404, { error: "Resource not found." });
  }
}

async function handleRequest(request, response, options) {
  let url;
  try {
    url = new URL(request.url ?? "/", "http://localhost");
  } catch {
    writeJson(response, 400, { error: "The request URL is malformed." });
    return;
  }

  const method = request.method ?? "GET";

  if (method === "GET" && url.pathname === "/api/health") {
    healthState.requestCount += 1;
    writeJson(response, 200, {
      status: "ok",
      service: "study-balance-ai",
      version: "1.0.0",
      diagnostic: true,
      requestCount: healthState.requestCount,
      uptimeSeconds: (Date.now() - healthState.startedAt) / 1000,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/demo") {
    const referenceDate = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("referenceDate") ?? "")
      ? url.searchParams.get("referenceDate")
      : todayISO();
    writeJson(response, 200, createDemoSchedule(referenceDate));
    return;
  }

  if (method === "POST" && url.pathname === "/api/analyze") {
    assertJsonContentType(request);
    const payload = await readJson(request);
    assertSchedulePayload(payload);
    writeJson(response, 200, analyzeSchedule(payload));
    return;
  }

  if (method === "POST" && url.pathname === "/api/simulate") {
    assertJsonContentType(request);
    const payload = await readJson(request);
    assertSchedulePayload(payload);
    writeJson(response, 200, simulateRebalance(payload));
    return;
  }

  if ((method === "GET" || method === "HEAD") && !url.pathname.startsWith("/api/")) {
    await serveStatic(response, url.pathname, options.publicDirectory, method);
    return;
  }

  writeJson(response, 404, { error: "Route not found." });
}

export function createAppServer(options = {}) {
  const serverOptions = {
    publicDirectory: options.publicDirectory ?? DEFAULT_PUBLIC_DIRECTORY,
  };

  return createServer((request, response) => {
    const requestId = request.headers["x-request-id"] ?? randomUUID();
    response.setHeader("X-Request-Id", requestId);

    handleRequest(request, response, serverOptions).catch((error) => {
      const domainValidationError =
        error instanceof TypeError || error instanceof RangeError || error instanceof URIError;
      const statusCode = Number.isInteger(error.statusCode)
        ? error.statusCode
        : domainValidationError
          ? 400
          : 500;

      if (statusCode >= 500) {
        console.error({
          requestId,
          method: request.method ?? "GET",
          url: request.url ?? "",
          error: error instanceof Error ? (error.stack ?? error.message) : error,
        });
      }

      if (!response.headersSent) {
        writeJson(response, statusCode, {
          error: statusCode >= 500 ? "The analysis could not be completed." : error.message,
        });
      } else {
        response.end();
      }
    });
  });
}

const isMainModule =
  process.argv[1] && normalize(process.argv[1]) === normalize(fileURLToPath(import.meta.url));

if (isMainModule) {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";
  const server = createAppServer();
  server.listen(port, host, () => {
    const displayHost = host === "0.0.0.0" ? "localhost" : host;
    console.log(`StudyBalance AI is running at http://${displayHost}:${port}`);
  });
}
