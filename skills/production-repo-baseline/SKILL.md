---
name: production-repo-baseline
description: "Establish the repository-owned production baseline for a new or existing application: reproducible dependencies, secret hygiene, CI, and Dependabot. Use when preparing a project to ship; do not use to choose product infrastructure or deploy."
---

# Production Repo Baseline

Create the small, obvious baseline every production repository needs without
guessing product architecture. GitHub is the default source-control and CI
platform for this workflow.

## Scope

Apply only repository-owned, universally useful controls:

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

## Workflow

1. Inspect the repo and preserve existing user-owned CI, Dependabot, and
   configuration files. Never replace them to fit this baseline.
2. Let `skill_root` be the directory containing this `SKILL.md`, then preview
   the deterministic file plan:

   ```sh
   (cd "$skill_root/scripts" && go run . --repo <repo-path> --json)
   ```

   Read the plan before writing.
3. Apply only after the target repo is clear:

   ```sh
   (cd "$skill_root/scripts" && go run . --repo <repo-path> --apply --json)
   ```

4. Run the generated CI commands locally where available. Validate
   `package.json`, the lockfile, `.github/workflows/ci.yml`, and
   `.github/dependabot.yml`; inspect the diff before committing.
5. For an explicitly named GitHub repository, enable Dependabot alerts and
   automatic security-fix PRs. Do not alter branch protection unless the user
   chooses the merge policy.

## Verification

The helper is preview-first and creates only missing files or appends missing
ignore rules. It emits the remaining conditional modules rather than treating
an empty CI job as production-ready.

Run its fixture test after changing it:

```sh
(cd skills/production-repo-baseline/scripts && go test ./...)
```

## Stop Conditions

Stop and report the gap instead of guessing when the project has no recognized
package manager/lockfile, invalid `package.json`, no recognized verification
scripts,
or an existing CI/Dependabot policy that needs a human decision. GitHub setting
writes require an explicit repository target and authenticated access.
