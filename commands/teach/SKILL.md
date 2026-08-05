---
name: teach
description: Use when /teach should run a one-question Socratic loop over a topic, transcript, notes file, or prior work session.
---

# Teach

Use `/teach <topic-or-path> [--student <name>]` when someone wants to understand material deeply enough to explain it back. With no argument, ask which topic, session, or file to learn from.

## Source resolution

When the argument is a readable file, read that file directly. For a topic, search only project-declared sources and configured non-secret paths; never assume a transcript directory. Extract goals and constraints, key decisions and rejected alternatives, evidence and verification, and open risks.

## Teaching loop

1. Make a concrete concept checklist and ask for the learner's current understanding.
2. Choose one unchecked concept.
3. Ask exactly one targeted question.
4. Mark it complete only when the answer explains the motivation and tradeoff.
5. If incomplete, explain the gap briefly and ask one rephrased question.
6. Continue until every concept is confirmed, then summarize the learner's demonstrated understanding and remaining risks.

Keep responses concise unless depth is requested. Do not edit source material unless explicitly asked.
