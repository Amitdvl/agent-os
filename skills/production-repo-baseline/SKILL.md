---
name: production-repo-baseline
description: "Found a new production repository from a short project brief, or harden an existing one: scaffold the chosen stack, then add reproducible dependencies, CI, and Dependabot. Use when starting a project or preparing it to ship; do not guess product infrastructure or deploy."
---

# Production Repo Baseline

Turn a short **build brief** into a runnable repository and its production
baseline. GitHub is the default source-control and CI platform. This is a
project-founder skill: an empty repository is a primary path, not an error.

## Scope

For a new repository, first use the named stack's official scaffolder. Then
apply only repository-owned, universally useful controls:

- a committed lockfile and a pinned runtime/package manager when the active
  package manager can be detected safely;
- a README, `.gitignore`, and `.env.example` that keep dependencies and secrets
  out of commits;
- pull-request CI that performs a deterministic install and runs existing
  `lint`, `typecheck`, `test`, and `build` scripts;
- Dependabot version-update configuration for the detected application package
  manager, root Dockerfile when present, and GitHub Actions.

Do not invent a deployment target, database, auth model, observability stack,
secrets, or a protected-branch/merge policy. Report those as explicit modules.
If the user has not named a project shape, ask only: **“What are we building:
Bun service, Bun React app, Next app, API, or something else?”**

## Workflow

1. Read the surrounding request as the build brief. A brief such as “Bun API”
   or “Bun React app” is enough to begin. For a named framework outside Bun,
   run its official non-interactive generator in the empty target repository;
   do not hand-write a fake framework scaffold.
2. For an empty Bun repository, let `skill_root` be the directory containing
   this `SKILL.md` and preview the complete creation-and-baseline plan:

   ```sh
   (cd "$skill_root/scripts" && go run . --repo <repo-path> --init bun --json)
   ```

   Supported Bun shapes are `bun`, `bun-react`, `bun-react-tailwind`, and
   `bun-react-shadcn`. The helper runs Bun's official initializer, makes a
   lockfile, then applies the baseline. Read the plan before writing.
3. Apply only after the empty target repository and chosen shape are clear:

   ```sh
   (cd "$skill_root/scripts" && go run . --repo <repo-path> --init bun --apply --json)
   ```

4. For an existing project—or immediately after a non-Bun official scaffold—
   preview and apply without `--init`. Preserve existing user-owned CI,
   Dependabot, and configuration files; never replace them to fit the baseline.
5. For a fresh project with no remote, initialize Git with `main` as the
   default branch. When the user has named the GitHub owner/repository (or the
   current target directory makes that exact target unambiguous), create a
   **private** GitHub repository through `gh`, add `origin`, commit the
   verified foundation, and push it. If the desired visibility or owner is not
   clear, ask instead of publishing to the wrong place.
6. Run the generated CI commands locally where available. Validate
   `package.json`, the lockfile, `.github/workflows/ci.yml`, and
   `.github/dependabot.yml`; inspect the diff before committing.
7. For an explicitly named GitHub repository, enable Dependabot alerts and
   automatic security-fix PRs. Do not alter branch protection unless the user
   chooses the merge policy.

## Verification

The helper is preview-first. In `--init` mode it never touches a non-empty
repository. It creates only missing baseline files or appends missing ignore
rules, and emits conditional modules rather than treating an empty CI job as
production-ready.

Run its fixture test after changing it:

```sh
(cd skills/production-repo-baseline/scripts && go test ./...)
```

## Stop Conditions

Stop and report the gap instead of guessing when an empty repo has no project
shape in its brief, `--init` targets a non-empty repo, the project has no
recognized package manager/lockfile, `package.json` is invalid, there are no
recognized verification scripts, or existing CI/Dependabot policy needs a
human decision. GitHub creation or setting writes require an explicit
repository target and authenticated access.
