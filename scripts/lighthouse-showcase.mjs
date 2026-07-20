import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const port = process.env.LIGHTHOUSE_PORT ?? "3001";
const targetUrl = `http://localhost:${port}/showcase?audit=1`;
const healthUrl = `http://localhost:${port}/showcase?audit=1`;
const reportsDir = path.join(rootDir, "lighthouse-reports");

function ping(url) {
  return new Promise((resolve) => {
    http
      .get(url, (response) => {
        response.resume();
        resolve(response.statusCode != null && response.statusCode < 500);
      })
      .on("error", () => resolve(false));
  });
}

async function waitForServer(url, attempts = 90, intervalMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await ping(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

function killPort(portNumber) {
  if (process.platform === "win32") {
    try {
      execSync(
        `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${portNumber} ^| findstr LISTENING') do taskkill /F /PID %a`,
        { stdio: "ignore", shell: true },
      );
    } catch {
      // Port was not in use.
    }
    return;
  }
  try {
    execSync(`lsof -ti:${portNumber} | xargs kill -9`, { stdio: "ignore" });
  } catch {
    // Port was not in use.
  }
}

function startProductionServer() {
  return spawn("npx", ["next", "start", "-p", port], {
    cwd: rootDir,
    stdio: "ignore",
    shell: true,
    detached: process.platform !== "win32",
    env: { ...process.env, PORT: port, NODE_ENV: "production" },
  });
}

function stopServer(serverProcess) {
  if (!serverProcess?.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"], {
      shell: true,
      stdio: "ignore",
    });
    return;
  }
  process.kill(-serverProcess.pid);
}

killPort(port);
console.log(`Starting fresh production server on port ${port}...`);
const serverProcess = startProductionServer();

const ready = await waitForServer(healthUrl, 90, 1000);
if (!ready) {
  stopServer(serverProcess);
  console.error("Production server did not become ready in time.");
  process.exit(1);
}

// Warm up the server and JIT before measuring.
for (let i = 0; i < 3; i += 1) {
  await ping(healthUrl);
}
await new Promise((resolve) => setTimeout(resolve, 1500));

fs.mkdirSync(reportsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputBase = path.join(reportsDir, `showcase-${stamp}`);

console.log(`Running Lighthouse on ${targetUrl}...`);
try {
  execSync(
    [
      "npx",
      "lighthouse",
      targetUrl,
      '--output="html"',
      '--output="json"',
      `--output-path="${outputBase}"`,
      '--chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage"',
      "--only-categories=performance,accessibility,best-practices,seo",
      "--quiet",
    ].join(" "),
    { cwd: rootDir, stdio: "inherit", shell: true },
  );
  console.log(`Reports written to ${reportsDir}`);
} finally {
  stopServer(serverProcess);
  killPort(port);
}
