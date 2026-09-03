import { spawnSync } from "node:child_process";

const python = process.platform === "win32" ? "python" : "python3";
const result = spawnSync(python, ["-m", "unittest", "discover", "-s", "templates/hooks/ctx7-guard/tests", "-p", "test_*.py"], {
  encoding: "utf8",
  stdio: "inherit",
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
