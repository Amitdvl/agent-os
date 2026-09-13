---
name: production-repo-baseline
description: Set up the mundane, repository-owned foundation for a new project: Git, safe defaults, Dependabot, and—once a stack exists—reproducible dependency and CI checks. Use for a fresh repo or to add this baseline; do not scaffold the product or choose its architecture.
---

# Production Repo Baseline

Set up the **second things** of a new repository: the small, boring controls
that every production project needs around its actual product. This is not an
app generator. It does not decide what to build or how to build it.

## Scope

Apply only repository-owned defaults that do not require product judgment:

- initialize Git with `main` when it is not already initialized;
- create or safely extend `.gitignore`, `.env.example`, and a minimal README;
- add Dependabot updates for GitHub Actions immediately, plus the detected
  dependency ecosystem and Dockerfile when they exist;
- when the project already has a committed lockfile, package-manager pin, and
  real `lint`, `typecheck`, `test`, or `build` scripts, add matching
  pull-request CI.

Do **not** scaffold Bun, Next, React, an API, or any product code. Do not
choose a deployment target, database, auth, observability, secrets, or branch
merge policy. Do not create a GitHub remote, commit, push, or change repository
settings unless the user explicitly asks for that external action.

## Workflow

1. In a new or existing local repository, preview the foundation. Let
   `skill_root` be the directory containing this `SKILL.md`:

   ```sh
   (cd "$skill_root/scripts" && go run . --repo <repo-path> --json)
   ```

   An empty directory is valid. It gets Git and the universal local files; it
   gets Dependabot's GitHub Actions updates, but no fake application CI.
2. Inspect the plan, then apply it:

   ```sh
   (cd "$skill_root/scripts" && go run . --repo <repo-path> --apply --json)
   ```

3. When the actual project is later initialized and has a lockfile plus real
   verification scripts, run the baseline again to add the package-manager pin,
   ecosystem Dependabot entry, and CI. Preserve existing CI and Dependabot
   configuration rather than replacing it.
4. If the user explicitly asks to publish to GitHub and names the owner,
   repository, and visibility, create the remote, then enable Dependabot alerts
   and automatic security-fix PRs. Keep this separate from the local baseline.
5. Validate generated YAML and run the actual verification scripts locally.
   Inspect the diff before any commit.

## Verification

The helper is preview-first. It writes only missing files or missing ignore
rules, initializes Git only when absent, and never creates an empty CI job just
to show a green badge.

Run its fixture test after changing it:

```sh
(cd skills/production-repo-baseline/scripts && go test ./...)
```

## Stop Conditions

Stop and report the gap instead of guessing when `package.json` is invalid, a
package manager or lockfile cannot be recognized, real verification scripts do
not exist yet, existing CI/Dependabot policy conflicts, Git is unavailable, or
GitHub publishing/settings lack an explicit target and authenticated access.
