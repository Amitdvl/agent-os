# Guard protocol, version 1

Run with Python 3. Commands accept one JSON object on stdin, and `--state` is an
explicit project-local file. Refusals exit 2; normal results exit 0. A normal
result may be terminal: always inspect `status`. The helper never calls a
native API or submits a prompt itself. The agent owns native tool integration.

| Command | Required input beyond `--state` | Result or behavior |
| --- | --- | --- |
| `propose` | `thread_id`, `objective`, `scope`, `done`; optional `max_cycles` (5), `max_seconds` (1200), `token_budget` (null) | Fresh immutable proposal, hash, human question, native objective; valid for 600 seconds |
| `bind` | `question_id` from the actual question tool | Binds one question item once |
| `authorize` | `source: native_user_input`, `role: user`, `question_id`, `thread_id`, `proposal_hash`, `answer: Approve` or `Decline` | Consumes exactly one matching human reply before expiry |
| `goal` | none | Exact native `objective` and optional `token_budget` |
| `activate` | `thread_id`, `native_goal` read from the native tool | Starts approved budgets and binds native Codex runtime identity |
| `begin` | Gate fields plus `action`, optional `input_evidence` | Charges one cycle and returns its unique `inflight.id`; one cycle at a time |
| `checkpoint` | Gate fields plus `cycle_id` | Checks scope, runtime, native goal and time before another tool batch |
| `finish` | Gate fields plus `cycle_id`, `outcome`, `evidence` | Records progress or ends the run |
| `stop` | `reason` | Terminal; cannot be resumed |
| `status` | none | Local ledger for inspection; does not grant permission to work |

Gate fields are `thread_id`, `proposal_hash`, and `native_goal`. A native goal
snapshot is `{"objective":"actual tool text","status":"active","tokenBudget":null}`.
The actual thread must match; never supply a snapshot copied from a different
thread. If tools use snake_case, normalize only field names, not values.

Finish outcomes are `progress`, `done`, `blocked`, `no_value`, `interrupted`,
`revoked`. Evidence is concise and concrete (for example a check result and
artifact path). Evidence text is an assistant attestation, not an independent
verification oracle. Repeating the same action and input evidence stops the
run; altering strings merely to evade this check violates the skill. No-value
work stops immediately. The last permitted cycle may finish successfully;
otherwise finishing it ends the run with `cycle_budget`.

The deadline starts at activation. Both elapsed monotonic time and wall time
are checked; backwards clocks stop a run. The nearest `codex`/`codex.exe`
executable ancestor's PID, executable path and process start timestamp bind the
run to its native runtime. Missing identity, restart, or identity changes stop
work. No caller-supplied runtime override is exposed by the CLI. The Python
function's injectable clock/identity dependencies are solely for tests.

Local state updates use an exclusive POSIX file lock, atomic replacement,
fsync, private creation modes, and refuse symlink state paths/hardlinked files.
These protect cooperating local processes from races and accidental reuse.
They do not protect against a malicious user with filesystem access, and are
not a security boundary around Codex's executor. Do not extend this into
unsupported app introspection or credential access.

The question's conditional pause instruction is part of the human-approved
scope. Native `paused` is requested on a non-success stop only under that
instruction; `complete` requires verified success. A denial before activation
must not pause an unrelated pre-existing goal. If native pause/edit tools are
unavailable, stop assistant work, disclose the host limitation and leave the
goal unfinished. Do not fake a successful pause.

Verification separates deterministic guard tests from live native wiring.
Exercise absent/declined/expired/replayed consent, drift, concurrency, duplicate
finishes, time/cycle boundaries, no-value/repetition, blockers/revocation,
runtime changes and persistence. Live activation requires its own exact native
question and affirmative human response. Never use a fixture reply as live
consent or claim local guard tests prove platform-enforced time limits.

Native goal semantics: [Codex long-running work](https://learn.chatgpt.com/docs/long-running-work)
and [documented app-server interface](https://learn.chatgpt.com/docs/app-server).
Use the host's native tool path when a separate supported client reports an
active writer; don't evade that writer lock.
