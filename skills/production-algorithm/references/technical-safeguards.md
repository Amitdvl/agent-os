# Technical safeguards for consequential changes

Use this reference when a proposed deletion, simplification, speedup, or automation could meaningfully affect people, money, protected data, access controls, recovery, or service reliability. Judge the actual change and its failure modes. A documentation edit or routine formatting change does not require deployment analysis merely because it concerns CI or authentication.

Include only the details needed to decide safely:

- **Invariant and evidence:** What protection or outcome must remain true? Which incident, dependency, contract, or test establishes its necessity? An unknown owner or a missing document is not evidence that the requirement can be deleted. A guardrail replacement needs proof of the same safety property.
- **Affected scope:** Which users, accounts, environments, systems, or data could be harmed? Bound the trial or rollout accordingly; avoid assuming a local result proves production behavior.
- **Reversal and stopping:** Who can restore the previous state, how, and what observation triggers rollback or adding a step back? For an irreversible change, do not imply that a rollback exists; require adequate pre-change evidence and explicit authority for the exact action.
- **Verification:** Define the evidence required before proceeding and the readback after an implemented change. Report missing, skipped, or unavailable checks as unresolved. Keep cleanup, recovery, and decisive failure evidence when removing downstream work or shortening checks.
- **Automation failure:** Where failure matters, verify the manual path, observable failure signals, and a usable fallback. Repeatability alone does not authorize automating an approval or consequential mutation.

Use the applicable global and project rules for permissions, secrets, and redaction. These are adaptations for agent work, not additional steps attributed to Musk.
