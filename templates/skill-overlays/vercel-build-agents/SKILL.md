---
name: build-agents
description: Build or extend eve agents on Vercel when eve is explicitly requested or already used. Read the installed versioned eve docs for tools, channels, schedules and deployment.
---

# Build Agents

Use this skill for a requested or established eve stack on Vercel. Generic
agent, Slack, scheduling or multi-agent requests do not choose eve or Vercel.
Inspect the existing app and user constraints first; compare runtimes when that
is the task. Preserve other explicit or established architectures.

## What eve is

eve is Vercel's filesystem-first framework for durable AI agents and
agent-powered applications. Agent behavior lives in files — instructions,
tools, skills — so it is versioned, reviewable, and deployable like any other
code. Sessions are durable: agents survive restarts and deploys and can run
long-lived or scheduled work.

High-level capabilities:

- **Durable sessions** — long-running, crash-safe conversations and jobs.
- **Tools** — typed actions the agent can take, defined in code.
- **Skills** — load-on-demand instruction files for specialized behavior.
- **Connections** — managed auth to external APIs and MCP servers, backed by
  Vercel Connect.
- **Channels** — external surfaces such as Slack, GitHub, or Linear where the
  agent sends and receives messages.
- **Sandboxes** — isolated environments for running generated or untrusted
  code.
- **Subagents, schedules, and evals** — delegation, recurring runs, and
  quality checks.
- **Frontend clients** — build agent-powered UIs on the same runtime.

## Getting started

1. Run init:

   ```bash
   npx eve@latest init <agent-name>
   ```

2. Read the docs. Versioned docs ship with the package at
   `node_modules/eve/docs/README.md` — once eve is installed, treat them as
   the implementation source of truth. Public docs: https://eve.dev/docs. Load
   the `eve` skill for detailed framework guidance while working inside the
   project. Do not recreate eve API guidance from memory.

For an already selected eve project, follow its versioned conventions. Use Vercel AI
Gateway model strings by default; do not introduce provider API keys unless
the user needs a non-Vercel or provider-specific setup.

## Slack Agents

For Slack agents in the selected eve stack, use its Slack integration guidance. For Slack-specific projects, leverage the
Slack Agent Skill instead of duplicating its wizard and reference material:

```bash
# First inspect installed skills; use the host skill-installer only if needed.
```

If that skill is already installed, read its `SKILL.md` and its relevant
`wizard/`, `reference/`, or `patterns/` files before scaffolding or changing a
Slack agent.

The expected Slack stack is:

- eve for the agent runtime.
- `@vercel/connect` for Slack credentials and webhook verification.
- `agent/channels/slack.ts` for the Slack channel.
- `SLACK_CONNECTOR` as the Slack connector identifier.
- `/eve/v1/slack` as the Connect trigger path.

The Slack stack above is scoped to eve. It does not override a user-selected
Chat SDK, Bolt or existing non-eve project.

## Boundaries

- Do not use Vercel Agent for generic agent building. Vercel Agent is the
  platform feature for code review, incident investigation, and SDK
  installation.
- Do not duplicate the Slack Agent Skill's setup wizard in this skill.
- Do not hardcode credentials, Slack bot tokens, signing secrets, or provider
  API keys into generated projects.

## References

- eve source: https://github.com/vercel/eve
- Slack Agent Skill: https://github.com/vercel-labs/slack-agent-skill
- Slack integration guide: https://docs.slack.dev/ai/getting-started-with-vercel-skill/
- Vercel Connect: https://vercel.com/docs/connect
