# Prompt Assembly

Use this reference after the conversation has resolved the high-impact choices. It converts visual state into a compact production prompt; it is not an intake checklist.

## Power grammar

Use only relevant fields:

```text
Purpose / format:
Primary request:
Subject / action:
Focal hierarchy:
Composition / camera:
Lighting / mood:
Materials / palette:
Visual language:
Text (verbatim):
Reference roles / priority:
Mutable:
Immutable / locked:
Avoid:
```

Order information from the global outcome toward local constraints. Describe relationships—where the subject sits, where light comes from, what the viewer notices, how materials respond—instead of stacking praise words.

## Compression rules

- Prefer concrete nouns and art-direction verbs: isolate, emphasize, subordinate, declutter, rebalance, sculpt, integrate, ground, mute, refine.
- Translate vague style words into observable behavior. “Quiet luxury” might mean generous negative space, warm limestone, brushed metal, off-white linen, soft directional light, and restrained contrast.
- Use one primary medium or production language. Add secondary texture cues only when compatible.
- State composition and camera behavior rather than relying on “cinematic.”
- Describe material response rather than saying “realistic.”
- Omit fields that do not matter. Longer is not automatically more controllable.

## Augmentation boundary

Make implicit production requirements explicit without inventing creative content. A landing-page hero may imply a wide canvas and copy-safe negative space. It does not imply a mascot, slogan, extra prop, brand, or new subject.

Recommendations remain proposals until accepted unless the user has said “surprise me” or “just generate it.” Even then, infer conservatively from purpose and never invent visible text.

## Exact text

Keep visible text in one canonical verbatim block. Preserve all characters, case, punctuation, diacritics, Unicode, whitespace, and line breaks. Put non-rendered spelling hints outside the block. Add only relevant exclusions such as `no other text`, `no pseudo-text`, or `no placeholder copy`.

## Negative constraints

Name only plausible failure modes:

- extra or pseudo-text when typography matters;
- extra props or people when a single focal subject matters;
- subject, geometry, camera, crop, or typography drift during edits;
- background clutter when copy space matters;
- excessive bloom, fog, flare, bokeh, oversharpening, or plastic skin when those are likely risks.

Do not append an indiscriminate negative list to every prompt.

## Generate template

```text
Create a [supported canvas / intended ratio] image for [purpose].

Show [subject and action]. The viewer should notice [first], then [second].
Place [subject] [position]; preserve [negative space / depth relationship].
Use a [plain camera relationship] with [focus behavior].
Light from [believable source and direction], with [soft/hard] quality and [mood].
Render [materials] with [surface response]. Use [palette and medium].

Text (verbatim):
[exact copy or “none”]

Constraints: [only relevant avoid items].
```

## Edit template

Use the canonical mutable/immutable structure in [editing-and-references.md](editing-and-references.md). Do not compress away invariants: the edit boundary is the core request.

## Quality and execution

- Start low quality only when the user is deliberately exploring quickly; use high quality for text or critical detail.
- For strict identity or layout edits, consider high input fidelity.
- Map intended aspect ratio to a supported API canvas from [image-api.md](image-api.md); preserve the compositional consequence.
- For multi-image inputs, preserve attachment indices and role precedence exactly.

For examples only, read [sample-prompts.md](sample-prompts.md). For visual vocabulary, load only the relevant domain reference.
