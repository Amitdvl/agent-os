# Conversation and Visual State

Use this reference to decide whether to ask, what to ask, how to recommend, and how to carry art direction across turns. The user should make meaningful creative choices without needing to know visual-production vocabulary.

## Specificity gate

Classify the request before asking:

| Request state | Action |
| --- | --- |
| Escape phrase such as “surprise me” or “just generate it” | Infer from purpose and proceed; do not create a confirmation gate. |
| Clear targeted edit | State the change and invariants, then edit. |
| Detailed concept with purpose, subject, direction, and constraints | Proceed, or ask at most one unresolved high-impact question. |
| Vague concept with meaningful creative forks | Ask one compact round of 1–3 semantic questions total. |
| Required image/text/role is missing or contradictory | Ask only for that requirement. |

A question is high impact when different answers would change the subject, composition, medium, emotional read, output use, exact text, or edit invariants. Infer details that are cheap to reverse or merely polish the image.

Do not treat a prompt as vague merely because it omits camera, lighting, palette, or material terminology. Ordinary descriptions such as “quiet,” “close and personal,” or “clean enough for a homepage” may already settle those decisions.

## Ask about consequences

Use this pattern:

```text
Plain-language choice → what the viewer will see or feel → recommended default and reason
```

Good:

> Should this feel observed in a real moment, or arranged like a polished campaign? The first keeps natural asymmetry and available light; the second gives cleaner spacing and controlled reflections. For an About page, I recommend the observed version because it feels more credible.

Avoid:

> Do you want a 35 mm or 85 mm lens with high-key or low-key lighting?

When structured-choice UI is available and useful, offer 2–3 mutually exclusive options with the recommended option first. Otherwise use concise chat. Do not split one intake round into a serial interview unless the answer exposes a genuinely new, material conflict.

## Candidate question pool

Choose only the unresolved questions with the highest consequence; never ask this whole list.

- **Use:** Where will the image appear, and what shape must it fit?
- **Attention:** What should the viewer notice first?
- **Relationship:** Should the subject feel close and immediate, balanced and observational, or composed and iconic?
- **World:** Should it feel like a real environment, a controlled set, a graphic system, or an invented world?
- **Energy:** Calm and restrained, warm and human, bold and kinetic, or tense and dramatic?
- **Copy:** Must any exact words appear, and where should clear space remain?
- **References:** Which image controls the subject, arrangement, light/color, surface treatment, or typography?
- **Edit boundary:** What may change, and what must remain exactly as it is?

Recommend from the intended use. A recommendation must not silently add a new subject, prop, logo, message, or brand.

## Visual state

Maintain only fields that matter to the current request:

```text
Purpose / format:
Subject / action:
Focal hierarchy:
Composition / camera relationship:
Lighting / mood:
Materials / palette / medium:
Exact text:
Reference roles / priority:
Constraints:
Mutable now:
Immutable / locked:
Open decision:
```

State is a decision record, not a form the user must fill out. Keep it internally unless showing a short brief would prevent ambiguity or help the user choose.

## State updates and locks

- Treat each revision as a delta against the current state.
- When the user says a dimension is right or asks to lock it, move that dimension to `Immutable / locked`.
- A later request changes only the named mutable dimension and any physically necessary integration local to it.
- Do not unlock composition, identity, geometry, camera, crop, typography, or other accepted state without an explicit user request.
- Restate relevant invariants in every edit request; do not rely on earlier prompts to preserve them.
- When a user asks for a new concept, start new state rather than accidentally inheriting old constraints.

For a batch, keep one shared state for the collection plus short per-item deltas. Ask one shared intake round, not 1–3 questions per asset.

## Explain while collaborating

Teach only at the point of use:

- name the plain-language effect first;
- optionally give the professional term in parentheses;
- explain the visible tradeoff in one sentence;
- make a recommendation;
- continue the work without turning the exchange into a lesson unless the user wants one.

The user only needs to remember the outcome, the main subject, what must not change, and any taste references. Translate the rest.
