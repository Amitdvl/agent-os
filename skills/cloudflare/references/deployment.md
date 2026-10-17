# Deploy on Cloudflare

Modified by Agent OS: focused deployment contract consolidated from Cloudflare Deploy.

Inspect the existing repo scripts, Wrangler configuration, account, environment,
bindings and intended hostname before choosing Workers or Pages. Preserve the
existing provider and deployment convention. Use the product references from
this package; retrieve current official docs before relying on API or limit details.

Before `wrangler deploy`, `wrangler pages deploy`, or a repo deploy script, run
`wrangler whoami` (or the project's package-manager equivalent). Read
[Wrangler authentication](wrangler/auth.md) for OAuth/headless troubleshooting.
Use the configured vault skill for credential lookup/injection and inventory;
never ask for token values in chat or print them. OAuth remains a human login
checkpoint when required. A missing/wrong account is not authority to create or
replace credentials. Verify least privilege for the actual resources.

Run the repo build/tests and supported dry-run/preview before publishing. Confirm
that the request identifies the intended external action and target; existing
explicit deployment authority applies. Do not publish merely because a local
build was requested. Preserve other environments, routes and resources.

Respect the runtime's actual network and permission interface. Diagnose errors
before retrying; do not invent escalation flags, bypass a denial, or repeatedly
publish when the previous result is uncertain. Reconcile remote state first.
After deployment, verify the returned URL, intended environment and a meaningful
health/interaction check. Report pending DNS/auth propagation honestly. Summarize
config changes and required variable names, never secret values.
