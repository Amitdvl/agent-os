---
name: teach
description: Use when the user invokes /teach to run a Socratic teaching loop over a topic, transcript, notes file, or prior work session.
---

# Teach

Use `/teach` when the user wants to understand a prior session, technical topic,
change, transcript, or notes file deeply enough to explain it back.

## Usage

```text
/teach <topic keywords>
/teach <path/to/file>
/teach <topic> --student <name>
```

No argument: ask which session, topic, or file the user wants to learn from.

## Source Resolution

When the argument is a file, read it directly. When the argument is a topic,
search only sources the current project or user config declares. Do not assume a
fixed transcript directory.

Extract:

- user goals and constraints;
- key decisions and rejected alternatives;
- evidence that mattered;
- verification performed;
- open risks or follow-up work.

## Teaching Loop

1. Create a checklist of concrete concepts.
2. Ask the user to explain their current understanding.
3. Pick one unchecked concept at a time.
4. Ask one targeted question.
5. If the answer is correct, mark the concept complete.
6. If the answer misses the point, explain the gap and re-ask differently.
7. Finish only when every concept is confirmed.

## Rules

- One question at a time.
- Teach motivation and tradeoffs, not just event sequence.
- Keep responses concise unless the user asks for depth.
- Do not edit source material unless explicitly asked.
