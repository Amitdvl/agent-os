---
name: open-brief
description: Delegate research, implementation, or several milestones through a concise outcome brief when the user asks for a fresh agent, independent judgment, or delegation without micromanagement; let the agent choose its approach.
---

# Open Brief

Give the receiving agent enough context to exercise judgment, while leaving the
problem-solving method to it. Use when the human wants independent thinking,
a fresh perspective, or delegation without micromanagement. Ordinary tasks with
an agreed implementation contract do not need reframing.

## Natural-language invocation

Use this skill when the user says, for example, “give a fresh agent the goal and
let it figure out how,” “delegate this without micromanaging,” or “get an
independent reassessment.” No skill name or special phrase is required. Match
the intention in context, not keywords alone: a request to discuss delegation or
only draft a brief does not authorize dispatch. Research, implementation and
assignments with several required milestones all qualify; preserve every
required outcome and the actual authority.

## Write the brief

Distill the user's intended outcome or decision from the conversation. Include
only context that materially changes the assignment:

- What the human wants to achieve or understand, and why it matters now.
- The few established facts, with suspicions and desired timelines identified
  as hypotheses or aspirations rather than conclusions to validate.
- Essential constraints, evidence entry points and the agent's actual authority:
  investigate and recommend, experiment, or implement an already authorized outcome.
- What would make the response useful to the human, without dictating its format.

Use a few short paragraphs, not a miniature project plan. Prefer pointers to
primary artifacts over accumulated summaries or a conversation transcript. Do
not omit decisive context just to make the prompt short. Ask for clarification
only when missing information changes the outcome or authority materially.

Invite the agent to form its own hypotheses, challenge inherited assumptions,
and choose sources, tools and methods. Preserve the user's real requirements;
an inherited workflow can be questioned without silently relaxing the goal or
overriding safety and access rules. If a requirement itself may deserve revision,
the agent should explain that tradeoff for the human to decide.

Do not preload a suspected bottleneck, preferred architecture, solution menu,
research sequence, worker count, exhaustive checklist, or promised speedup unless
the user actually requires it. An open brief is useful beyond research: the
agent can own execution when that execution is authorized.

## Hand over and let the agent work

Invoking this skill with a problem requests delegation, unless the human asks
only for a draft prompt. Infer the assignment from the current conversation;
do not make the human repeat the intention or ask again for already granted
delegation authority. Send the concise brief with essential resource pointers
to a fresh agent, rather than merely explaining how delegation could work. Create a
separate user-visible chat only when the human explicitly requests one; otherwise
use an authorized subagent. Preserve actual project, host and model preferences.
Do not create another goal or supervision layer just to deliver the assignment.

Verify dispatch, then avoid successive instructions that quietly prescribe the
investigation. Intervene for a material correction, missing authority, a genuine
blocker, or demonstrated drift from the user's outcome. Do not invent polling
cadences, time limits, or token budgets.

Judge the result by its evidence and usefulness to the human's decision or
outcome, not agreement with the sender. Distinguish demonstrated feasibility
from estimates. An assessment request does not authorize cancelling an existing
run, discarding work, or starting a replacement build.

## Example brief

> We want [outcome]. Progress so far has left us uncertain whether the current
> approach is appropriate. The human suspects [hypothesis] and hopes for [target];
> neither is established. Investigate independently using [essential evidence
> pointers]. Challenge our assumptions and choose your own approach. Explain what
> the evidence supports, what remains uncertain, and what you recommend. This
> assignment authorizes [assessment / bounded experiments / implementation];
> preserve [essential constraints].

Adapt the example to the actual request; its fields are not a required checklist.
