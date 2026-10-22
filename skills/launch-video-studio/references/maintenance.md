# Quiet prompt-time maintenance

Apply this on either host at the start of every user prompt in the Studio repo,
and whenever this skill handles Studio work elsewhere. This is an agent workflow;
it runs when Codex handles a prompt, alongside Studio's existing background update
and film-sync services. It does not add a timer, daemon, or operating-system hook.

Run `node <this-skill>/scripts/maintenance.mjs --repo <canonical-development-repo>`;
add `--project <film>` when the request identifies a film. Without a film, inspect
all already-enabled films, never opt additional films into sharing. A film filter
limits reported sync actions; all enabled films still guard against restarting
during another film's pending transport. The helper
returns `snapshot`, `actions`, `deferred`, and `attention`. It reads local state,
remote Git identities and the existing controller's doctor; it performs no
maintenance mutations. A remote failure is uncertainty, never proof of sync.
Use private workspace registration to resolve host-local paths. Do not copy paths
between machines or select a similarly named checkout. For an explicit development
override, retain that mode; do not change installations behind the user's back.

Execute warranted actions quietly through these existing interfaces, then inspect
again. Recheck preconditions immediately before mutations. A healthy result with
empty actions needs no further work or maintenance narration. Deferred work alone
is not a reason to interrupt an unrelated request. Report a material failure or
user decision when it affects the request, threatens retained work, or prevents
maintenance from completing. Do not repeat unchanged warnings on every prompt.

Use the probe's Git safety envelope for mutations too: clear inherited Git
directory/index/object/config overrides, disable fsmonitor and hooks per process,
and use the exact inspected checkout and origin. Preserve user Git configuration.

- `fetch-repo`: fetch `origin main` metadata in the named canonical checkout,
  without checking out files. Inspect again before deciding to update.
- `refresh-repo`: fetch `origin main`, then recheck branch, tracked/index edits,
  remote identity and ancestry. Only on clean tracked/index `main`, fast-forward
  with `git merge --ff-only origin/main`. Untracked work must survive; a collision
  blocks the update. Never switch branches, stash, discard, reset, force, or
  automatically merge divergent histories. An ahead checkout belongs to its
  ongoing task; finish intended work through the normal verified publish flow.
- `update-studio`: run the registered controller's `update --root <managedRoot>`.
  Its verified release and ownership checks remain authoritative. If it reports a
  restart is required, inspect again and restart through the installed workspace
  client's `managed restart --url <url>` only while idle. Any fresh editor session,
  rendering/unknown job, pending film transfer or uncertain activity defers restart.
  Never close sessions to manufacture idle state. After restart, rediscover and
  require the active revision and daemon launch identity to agree.
- `repair-studio`: inspect `doctor` first, then use the controller's normal bounded
  `update`/`open` recovery within the existing owned installation while idle. Do
  not start a healthy stopped installation merely for an informational prompt.
  Never clear paused retry budgets with a blind `--retry`; diagnose and repair the
  actual cause first. If a real cause is resolved and retry is appropriate to the
  current request, use the existing explicit retry once and verify the outcome.
  Unknown launch ownership or activity requires investigation, not process killing.
- `sync-film`: inspect the existing client's `sync <film> --operation diagnostics`
  and allow its background service to complete pending work. Recheck status; use
  the existing explicit retry only after resolving its cause. This action does
  not mean run `now` on every prompt: that resets the failure budget. Never take
  ownership, enable sharing, choose conflict content, bulk-download films, or
  overwrite local work as maintenance. A deliberate handoff/recovery follows the
  user's actual film request and the established Studio contract.

No ordinary prompt should trigger tests, reinstalls, dependency upgrades, source
commits, release qualification, or restarts merely because an inspection ran.
Substantive requested changes still need proportionate tests and normal verified
commit/merge/push completion. A development repo update is separate from installed
software adoption: only a valid published, both-platform verified release can
advance the installed runtime. Never fabricate the release marker. Existing film
kit snapshots adopt changes deliberately.

After a completed editing handoff, the previous computer may retain a paused
`WRITER_CHANGED` retry. If it is no longer the writer, the film is clean, and its
complete Git tree matches the known remote film tree, the probe records
`handoffComplete: true` and treats this retained pause quietly. It preserves the
ledger and ownership. Local edits, unknown remote state, other errors and actual
conflicts do not qualify for this exception.

The probe's observations are a point-in-time view, not a lock. Studio's own
transaction/ownership guards remain the final authority. Unknown or malformed
state must defer destructive/interrupting actions. A stopped server has no health
failure merely because it is stopped; the ordinary open path checks health when
Studio is actually needed. The probe does not install dependencies to test them.
