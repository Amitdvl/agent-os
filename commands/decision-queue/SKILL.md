---
name: decision-queue
description: Capture a natural-language decision or uncertainty in the configured Notion Decision Queue. Use when the user asks to add a decision, question, or uncertainty to their queue; do not use for task tracking or for changing the queue's schema or views.
---

# Decision Queue

Capture one decision-ready uncertainty as an unresolved row in the user's configured Notion Decision Queue.

## Usage

```text
/decision-queue Should we offer annual billing before launch?
```

Natural-language requests such as "Add this to my decision queue" should use the same workflow.

## Configuration

Read the user-owned configuration at `~/.codex/decision-queue.json`. It supplies the Notion database and data-source identifiers, and must never be copied into this portable command or committed to source control. It contains no credentials; use the registered Notion integration and Agent Vault for authentication.

If the configuration is absent or malformed, stop and ask the user to configure a Decision Queue rather than guessing a destination.

## Capture

- Use the user's wording as the basis for **Decision / uncertainty**. Ask one concise question only if there is no identifiable decision or uncertainty.
- Preserve provided reasoning, scores, cost, or proposed test. Do not invent research findings, evidence, or a result.
- For omitted fields, add workable provisional values: **Why it matters** should state the likely consequence; **Decision importance**, **Uncertainty**, and **Cost/time to resolve** should each be a 1–10 estimate; **Cheapest useful evidence/test** should be the smallest concrete test likely to reduce uncertainty.
- Default **Status** to `Unresolved` and leave **Decision/result** empty.
- Treat score inputs as estimates, not facts. In the confirmation, state every value that was inferred.

## Write and Verify

1. Run the registered Notion authentication preflight and fetch the configured data source to confirm its schema.
2. Create exactly one page in that data source using its current property names. Do not alter the database, view, score formula, or other records.
3. Verify that the created row has `Unresolved` status and is present in the score-sorted unresolved view when a view identifier is configured.
4. Return the created row link and a compact summary of the decision, score inputs, and cheapest test.

The user explicitly asking to add an item authorizes this one record creation. Requests to edit, decide, archive, or delete records require separate explicit direction.
