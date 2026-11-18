import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { constants } from "node:os";
import { createInterface } from "node:readline";

const require = createRequire(import.meta.url);
const next = require.resolve("next/dist/bin/next");
const useColor = process.stdout.isTTY && !process.env.NO_COLOR && process.env.FORCE_COLOR !== "0" && process.env.TERM !== "dumb";

const server = spawn(process.execPath, [next, ...process.argv.slice(2)], {
  stdio: ["inherit", useColor ? "pipe" : "inherit", "inherit"],
  env: useColor ? { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || "1" } : process.env,
});

if (server.stdout) {
  const lines = createInterface({ input: server.stdout, crlfDelay: Infinity });
  lines.on("line", (line) => {
    const colored = line.replace(/^(\s*-\s+(?:Local|Network):\s+)(https?:\/\/\S+)/, "$1\x1b[94m$2\x1b[39m");
    process.stdout.write(`${colored}\n`);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.kill(signal));
}

server.once("error", (error) => console.error("Could not start Summit.", error.message));
server.once("close", (code, signal) => {
  process.exitCode = code ?? (signal ? 128 + constants.signals[signal] : 1);
});
