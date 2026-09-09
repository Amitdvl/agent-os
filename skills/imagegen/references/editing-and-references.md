# Editing and Reference Control

Use this reference for any operation on supplied images: targeted edits, masks, identity preservation, background work, compositing, localization, style transfer, sketch conversion, or multi-reference generation.

## Canonical edit contract

Before execution, represent the request in this order:

```text
Primary image / target:
Requested change:
MUTABLE:
- only the properties allowed to change

IMMUTABLE / LOCKED:
- identity and geometry
- camera, perspective, crop, and composition
- typography and labels
- all unmentioned objects and properties

Integration:
- local perspective, lighting, shadow, reflection, color, and focus matching

Do not:
- redesign, reinterpret, beautify, reposition, add, or remove anything else
```

Tailor the invariant list to the actual image. Do not state an invariant that directly conflicts with the requested change. Physically necessary local integration—such as a changed wall reflecting existing light—does not authorize a global lighting redesign.

For high-risk drift, sandwich the change between preservation instructions: state invariants, state `CHANGE ONLY`, explain local integration, then repeat the critical invariants.

## Targeted edits

- Use edit semantics rather than regenerating the scene.
- Identify the smallest mutable region or property.
- Preserve subject identity, silhouette, proportions, topology, spatial relationships, camera, framing, and crop when relevant.
- Treat accepted composition and typography as locked.
- Carry the full invariant set into every later edit, even when only one new variable changes.
- A final polish pass may improve edge quality, contact shadows, microtexture, and integration; it must explicitly prohibit redesign.

Use a mask when a localized region can be defined reliably. Follow mask format and size requirements in [cli.md](cli.md) and [image-api.md](image-api.md). A mask narrows the editable region but does not replace explicit invariants.

## Reference roles

Label every supplied image by index and give it one or more bounded roles:

- **subject:** identity, geometry, proportions, distinctive details;
- **composition:** arrangement, crop, scale relationships, negative space;
- **lighting:** source direction, softness, contrast, color spill;
- **palette:** color relationships only;
- **material:** surface finish and texture behavior;
- **style:** medium, rendering, linework, or production treatment;
- **wardrobe:** garment design and construction;
- **environment:** location or set;
- **typography:** hierarchy and type mood, not copied wording or logos.

Then state precedence. Example:

```text
Image 1 controls product identity and geometry.
Image 3 controls spatial arrangement.
Image 2 controls lighting and palette.

Priority: preserve Image 1 identity; preserve Image 3 layout; apply Image 2 treatment.
Do not transfer Image 2 objects, logo, text, or subject design.
Do not transfer Image 3 subject or branding.
```

Do not collapse multiple references into “use these as inspiration.” If roles are absent and materially ambiguous, ask one plain-language role question, such as which image should control the subject, arrangement, or light/color. When the images make a likely mapping visible, recommend it and identify it as an inference.

## Reference leakage

State both what to borrow and what not to borrow:

- borrow light direction, not objects;
- borrow palette, not branding;
- borrow spatial rhythm, not the depicted subject;
- borrow surface treatment, not product design;
- borrow type mood, not visible wording;
- create an original composition when only general art direction is requested.

Never copy logos, text, characters, or unrelated elements from a reference unless the user explicitly requests and is authorized to use them.

## Identity preservation

For people, characters, products, architecture, or branded objects, lock the properties that make the subject recognizably the same: face, expression, body proportions, pose, hair, wardrobe, product geometry, label, structural layout, camera, and crop as applicable. Use `input_fidelity=high` when supported and needed, but still state invariants explicitly.

## Transparent assets

For extraction or isolated generation, specify real alpha transparency, a clean silhouette, no halo, and a transparent margin. State whether a contact shadow is allowed. “Transparent background” means no wall, floor, scene, glow, decorative border, or baked checkerboard unless requested.

## Text localization and preservation

For localization, make only the requested wording mutable. Preserve layout, hierarchy, type treatment, alignment, color, and all non-text imagery. For packaging or signage that must not change, include the original lettering in the immutable state and inspect it character by character after generation.
