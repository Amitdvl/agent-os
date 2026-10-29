import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Preparation only: no agent invocation, installs, external services, or writes
// to the supplied instruction file. Pass only `launch` to a fresh executor.
export async function prepareImplementationEvaluation(name, {
  parent = tmpdir(), globalInstructions = join(homedir(), ".codex", "AGENTS.md"), mode = "forced-read",
} = {}) {
  if (!["checkout", "toolkit"].includes(name)) throw new Error("Unknown implementation fixture");
  if (!["forced-read", "discovery"].includes(mode)) throw new Error("Unknown evaluation mode");
  const fixture = JSON.parse(await readFile(join(ROOT, "tests/fixtures/implementation-discovery", `${name}.json`), "utf8"));
  if (mode === "discovery") {
    // Remove only the known explicit-read cues; fail closed if fixtures change.
    const projectCues = [
      "Read the installed global\ninstructions at <GLOBAL_INSTRUCTIONS> and follow this project's public\ncontract.",
      "Read the installed global instructions at <GLOBAL_INSTRUCTIONS>.\n",
    ];
    const projectCue = projectCues.find((cue) => fixture.files["AGENTS.md"].includes(cue));
    const requestCue = /Read the installed global instructions at <GLOBAL_INSTRUCTIONS> and the project's AGENTS\.md and follow (?:the )?normal available workflows\. /;
    if (!projectCue || !requestCue.test(fixture.request)) throw new Error("Fixture discovery cues changed");
    fixture.files["AGENTS.md"] = fixture.files["AGENTS.md"].replace(projectCue,
      projectCue.includes("public") ? "Follow this project's public\ncontract." : "");
    fixture.request = fixture.request.replace(requestCue, "");
  }
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
  console.log(JSON.stringify(await prepareImplementationEvaluation(process.argv[2], { mode: process.argv[3] ?? "forced-read" }), null, 2));
}
