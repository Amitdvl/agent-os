# Approved native continuation

Use `$approved-continuation` with a defined objective, scope and verifiable done
criteria. It can also be recommended automatically when useful remaining work
fits those criteria. The recommendation is a native human-input question, and
only an explicit human reply approving the exact proposal activates the run.
Declines and dismissals do not trigger repeated recommendations without a
material change or the human reopening the question.

The executor uses the same chat's native Codex goal. The default proposal is
five bounded work cycles and 20 minutes. Optional native token caps must be
explicitly proposed and approved. No prediction access, prompt sender, service
account, API credential or recurring automation is needed.

The core Agent OS package distributes the skill, protocol and standard-library
Python guard. Supported activation requires native Codex goal/human-input tools
and Python 3 on POSIX. Other hosts cannot substitute fabricated replies or
plain chat for the required native consent event. Read the
[skill](../skills/approved-continuation/SKILL.md) and
[guard protocol](../skills/approved-continuation/references/protocol.md).

Each proposal has a unique local state file and hash. The guard checks the
exact thread, native objective, approved budgets, runtime identity and single
in-flight cycle, then records concise evidence. Consent expires after ten
minutes if activation has not occurred. Restart, scope change, interruption,
revocation or a terminal stop requires a new proposal and fresh consent.
Repetition without new input and work with no expected value stop the run.
The final allowed cycle may complete successfully; an unfinished run stops
without being falsely marked complete.

Stop through the native pause control or a human stop/revoke instruction. The
question explicitly includes a conditional instruction to pause the matching
native goal on non-success stops. The executor must follow it, including when
state is missing or corrupt. A decline before activation never pauses an
unrelated existing goal. Native permissions continue to apply.

These are cooperative gates around work. They cannot preempt an in-flight
tool call, authenticate a human cryptographically, independently assess
semantic progress, or constrain an assistant that ignores the skill. The
optional token cap uses native Codex enforcement. This implementation does not
claim a platform-enforced wall-clock or cycle limit.
It has no background event subscription: the assistant must record known
stops/interruption events. A native UI pause and resume entirely between
checks cannot be identified from an unchanged active-goal snapshot alone.

The host's native goal tools are the preferred integration. An existing goal
can require the human's native Edit/Clear control when the current host lacks
an edit tool and a second documented app-server client encounters an active
writer. Never bypass the lock, fake completion to replace a goal, or modify
app databases. Activation waits for an exact native read-back.

## Verification

Run `node --test tests/approved-continuation.test.mjs` for guard contracts and
isolated-home package/catalog integration. Run
`python3 -B skills/approved-continuation/tests/run_evidence.py` for scoped line
measurement and seven assertion-checked fault challenges. These use fixture
human/goal events and do not prove live native wiring. A live demonstration
must obtain its own native human approval, create/read back a real goal,
execute guarded cycles across native continuation turns, and record the actual
goal outcome. Use disposable project-local artifacts for that demonstration.

The command catalog records the supported `$approved-continuation` invocation,
purpose, source and installed status. The legacy Awareness HUD may render its
row as `/approved-continuation`; its description states the supported dollar
invocation. Refresh and inspect the actual row after installation.

Verified on macOS during development: a real native approval activated a
disposable run; three guarded cycles executed across three distinct turns,
including two automatic native continuations. Marker files and the terminal
ledger were checked. Live failure/pause cases were not exercised. The automated
suite passed 115 Node tests (including 35 Python guard contracts), 14 hook
tests, and seven scoped assertion-checked faults. Those results do not convert
cooperative limits or assistant attestations into platform enforcement.
