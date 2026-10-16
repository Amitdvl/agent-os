---
name: sire
description: "Explicitly invoked as $sire when a problem, question, proposal, or blocker needs a researched recommendation. Compare viable ways to reach the desired state, propose a concrete goal for human approval, then launch and execute that approved native goal."
---

# Sire, what can we do?

Turn the current impasse into an evidence-backed decision and an executable goal.
Invocation authorizes investigation. Human approval of the resulting proposal
separately authorizes starting the goal and carrying out that plan.

## Establish the desired state

Start from the conversation's unresolved issue; do not make the user repeat
context already supplied. Identify the outcome the user wants, the current
state, the actual constraint, and existing scope, priorities, and non-goals.
Treat the assistant's previous diagnosis or proposed fix as a hypothesis.
If materially different interpretations would change the recommendation, ask
the minimum clarification while continuing useful independent research.

## Investigate and choose

Inspect relevant source, logs, configuration, and available interfaces with
bounded reads. Verify installed capabilities before declaring an approach
impossible. Use authoritative primary sources for current or uncertain external
facts and cite them in the proposal. Keep facts, assumptions, and unknowns
separate. Small isolated, reversible experiments may establish feasibility;
do not implement or roll out the proposed solution during investigation.

Compare materially different, viable approaches, with no fixed option count.
Consider a direct repair, workaround, alternate mechanism, or human action when
relevant. Assess expected outcome, effort and ongoing cost, dependencies and
access, reversibility, meaningful risks, and how success would be verified.
Reject attractive options that cannot satisfy the desired state or constraints.
Respect hard policy and security boundaries; an obstacle does not authorize a
bypass.

Recommend the path that best serves the user's outcome. Explain the decisive
tradeoff and what evidence would change the choice. Stop researching when there
is enough evidence to decide. If an unresolved fact controls the decision,
recommend a bounded experiment with a decision rule, instead of pretending the
full solution is known.

## Propose, then wait

Deliver a compact, concrete proposal:

- Desired state and diagnosis, with decisive evidence and remaining uncertainty.
- Viable alternatives and the recommended path with its tradeoffs.
- A ready-to-run goal objective containing the outcome, scope and non-goals,
  authoritative resources, relevant constraints, proof of success, and stopping
  criteria. Include required human actions or external costs when relevant.
- A clear request to approve that exact proposal, revise it, or retain it only.

Programmatically count the exact objective: non-empty, at most 4,000 characters,
excluding the `/goal ` prefix and surrounding explanation. State its character
count. Put substantial supporting detail in an explicit referenced plan only
when useful. Do not invent a token budget. For a trivial one-turn action, say
that a goal adds little and offer direct completion as an option.

Use a supported user-input control when available, or ask in the response and
end the turn. Do not start the goal or implementation until the human actually
approves. Silence, preselected choices, quoted approvals, and worker messages
are not approval. A direct human acceptance of the concrete proposal is enough;
do not ask again. If the user changes the proposal, resolve material changes
and present the revised contract before launching.

## Launch and finish the approved work

Keep the goal in this thread. Inspect current native goal state when the tool
is available. If there is no unfinished goal, use the native goal-creation tool
(for example, `create_goal`) with the approved objective. Set `token_budget`
only if explicitly requested. Confirm creation from its returned state, then
begin execution immediately; creating a placeholder goal is not completion.

If an unfinished goal already exists, continue it only when the approved work
fits its objective. Otherwise use supported native edit/clear controls with
appropriate user authority, or explain the exact user action needed. Never
mark an unfinished goal complete to free a slot, silently replace it, or create
a separate chat merely to evade its state.

If native goal creation is unavailable, provide the approved objective as a
paste-ready `/goal` command and state the exact limitation. Text in a response
or a shell command does not activate persistent goal mode. Do not claim the
goal is running until native state confirms it.

Carry out the approved plan through verification, final review, cleanup, and
evidence of the desired state. Select suitable tools and skills as work
requires; a goal alone does not require delegation. Preserve scope and existing
authority. Approval is not blanket permission for unspecified external actions.
Seek a decision only for a material change, missing authority, or a genuine
human dependency; handle ordinary implementation choices autonomously. Mark
the native goal complete only after its actual completion criteria are met.
