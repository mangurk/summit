import { spawn } from "node:child_process";

function runNpm(args) {
  return new Promise((resolve, reject) => {
    const npmCli = process.env.npm_execpath;
    const child = npmCli
      ? spawn(process.execPath, [npmCli, ...args], { stdio: "inherit" })
      : spawn("npm", args, { stdio: "inherit" });

    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal === "SIGINT" ? 130 : 1)));
  });
}

async function installDependencies() {
  console.log("Installing Summit dependencies. The first install can take a minute or two.");
  const started = Date.now();
  const progress = setInterval(() => {
    const seconds = Math.floor((Date.now() - started) / 1000);
    console.log(`Still installing dependencies (${seconds}s elapsed)…`);
  }, 5000);

  try {
    return await runNpm(["install", "--prefer-offline"]);
  } finally {
    clearInterval(progress);
  }
}

try {
  const installStatus = await installDependencies();
  if (installStatus === 0) {
    console.log("Dependencies ready. Starting Summit…");
    process.exitCode = await runNpm(["run", "dev", "--", ...process.argv.slice(2)]);
  } else {
    console.error("Dependency installation did not complete. See the npm output above.");
    process.exitCode = installStatus;
  }
} catch (error) {
  console.error("Could not start Summit.", error.message);
  process.exitCode = 1;
}
