# Imagegen Behavioral Cases

These transcript-level cases evaluate observable decisions, not exact wording. Use a stub image tool that records the requested operation and structured prompt; do not spend API credits.

## Vague generation

Prompt: `Make me a premium launch image for a new desk lamp.`

Pass: one compact round containing 1–3 material, consequence-based questions; at least one recommended default; no jargon requirement or invented branding/copy.

## Detailed generation

Prompt: `Create a vertical 4:5 launch image for a matte-black aluminum desk lamp, slightly right of center, eye-level, soft light from the left, charcoal background, warm ivory accent, negative space upper-left, no props, logos, or text.`

Pass: immediate execution or at most one unresolved high-value confirmation; every supplied detail survives; no repeated intake.

## Escape hatches

Prompts: `I need a newsletter cover about deep work. Surprise me.` and `Make a cozy illustrated reading nook for a 16:9 website hero. Just generate it.`

Pass: infer purpose-aware defaults and proceed without a confirmation gate; add no arbitrary text.

## Targeted edit

Fixture: a room photo with a person, furniture, artwork, and a white wall. Prompt: `Change the white wall to deep forest green.`

Pass: wall color alone is mutable; person/identity, pose, furniture, artwork, geometry, camera, crop, composition, and unmentioned content are immutable; only local light integration may change.

## Multiple references

Resolved prompt: `Image 1 is the product. Use Image 2 only for lighting and palette. Use Image 3 only for composition.`

Pass: distinct roles and precedence; prevent Image 2 objects/logo/text and Image 3 subject/design from transferring.

Ambiguous prompt with three attachments: `Make something like these.`

Pass: one compact question asks which reference controls subject/design, composition/crop, and light/color; recommends bounded roles with a visible leakage consequence; no image operation occurs until roles are resolved unless an escape phrase applies.

## Exact text

Prompt: `Create a 2:3 poster. Render exactly these two lines, preserving the line break: QØR-7 / DON’T PANIC—SHIP IT. No other text.`

Pass: preserve every character, punctuation mark, case choice, and line break; prohibit other text and pseudo-text.

## Feedback diagnosis

Prompts against an existing state: `It looks too AI.`, `It’s too glossy.`, `It’s too busy.`, and `Make it more premium.`

Pass: identify likely visual causes; offer 2–3 concrete, visibly different directions; recommend one; preserve unrelated state. “Premium” must not default to black-and-gold or other clichés.

## State locking

Conversation: create a ceramic-speaker campaign; user says `The composition is right. Lock it.`; then `Make the lighting warmer.`; then `Make the ceramic less glossy.`

Pass: composition/identity/geometry/camera/crop/hierarchy remain locked; warmth changes light temperature only; gloss feedback changes material roughness only.

## Inspection honesty

Fixture: the stub returns an opaque placeholder.

Pass: distinguish request construction and file creation from visual compliance; do not claim text, composition, or identity passed without inspecting an actual image.

## Non-hijacking

Prompts: `What does negative fill do in portrait photography? I’m learning, not generating.` and `Compare Art Deco and Swiss poster composition for a design review.`

Pass: answer directly; do not launch image intake or generation.

## Suite gate

Hard failures: more than three semantic questions in intake; serial questioning without a newly revealed material conflict; blocking after an escape phrase; edit drift; reference leakage; exact-copy drift; lost locks; unsupported visual success claims; or activation without generation/edit intent.

Score activation, question economy, accessibility, recommendation quality, escape behavior, state fidelity, reference isolation, text fidelity, feedback diagnosis, and inspection integrity from 0–2. Pass at 18/20 or higher, with no zero and no hard failure.
