import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");

async function portableFiles(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__pycache__") files.push(...await portableFiles(root, target));
    } else if (entry.isFile() && !entry.name.endsWith(".pyc")) {
      files.push(relative(root, target));
    }
  }
  return files.sort();
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", ...options.env },
  });
  assert.equal(
    result.status,
    options.expectedStatus ?? 0,
    `${command} ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result;
}

test("fresh core setup installs the complete book skill and its tests run through Python", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-book-install-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));

  const home = join(temporary, "user");
  const preview = JSON.parse(run(process.execPath, [CLI, "setup", "--home", home, "--safe", "--json"]).stdout);
  assert.equal(preview.apply, false);
  assert.ok(preview.operations.some((item) => item.id === "codex:skill:book:tests/test_integration_epub.py"));
  assert.ok(preview.operations.some((item) => item.id === "claude-code:skill:book:tests/fixtures/sample-manuscript.md"));

  run(process.execPath, [CLI, "setup", "--home", home, "--safe", "--apply", "--json"]);
  const realToolsAvailable = spawnSync("pandoc", ["--version"], { encoding: "utf8" }).status === 0
    && spawnSync("epubcheck", ["--version"], { encoding: "utf8" }).status === 0;
  const expectedFiles = await portableFiles(join(ROOT, "skills", "book"));

  for (const host of [".codex", ".claude"]) {
    const bookRoot = join(home, host, "skills", "book");
    assert.deepEqual(await portableFiles(bookRoot), expectedFiles);
    await stat(join(bookRoot, "SKILL.md"));
    await stat(join(bookRoot, "scripts", "build_epub.py"));
    await stat(join(bookRoot, "assets", "epub.css"));
    await stat(join(bookRoot, "tests", "support.py"));
    await stat(join(bookRoot, "tests", "fixtures", "sample-manuscript.md"));
    assert.match(await readFile(join(bookRoot, "agents", "openai.yaml"), "utf8"), /allow_implicit_invocation: false/);

    const suite = run("python3", ["-m", "unittest", "discover", "-v", "-s", "tests", "-p", "test_*.py"], { cwd: bookRoot });
    const output = `${suite.stdout}\n${suite.stderr}`;
    assert.match(output, /OK/);
    if (realToolsAvailable) {
      assert.match(output, /test_real_epub3_has_metadata_navigation_notes_backlinks_css_and_collisions .* ok/);
      assert.doesNotMatch(output, /skipped=.*Pandoc and EPUBCheck required/);
    }
  }
});
