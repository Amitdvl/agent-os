import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Preparation only: no agent invocation, installs, external services, or writes
// to the supplied instruction file. Pass only `launch` to a fresh executor.
export async function prepareImplementationEvaluation(name, {
  parent = tmpdir(), globalInstructions = join(homedir(), ".codex", "AGENTS.md"),
} = {}) {
  if (!["checkout", "toolkit"].includes(name)) throw new Error("Unknown implementation fixture");
  const fixture = JSON.parse(await readFile(join(ROOT, "tests/fixtures/implementation-discovery", `${name}.json`), "utf8"));
  const project = await mkdtemp(join(parent, `${name}-release-`));
  const render = (text) => text.replaceAll("<PROJECT>", project).replaceAll("<GLOBAL_INSTRUCTIONS>", globalInstructions);
  for (const [relative, content] of Object.entries(fixture.files)) {
    const target = join(project, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, render(content));
  }
  await writeFile(join(project, "REQUEST.md"), render(fixture.request));
  return { project, launch: render(fixture.launch) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await prepareImplementationEvaluation(process.argv[2]), null, 2));
}
