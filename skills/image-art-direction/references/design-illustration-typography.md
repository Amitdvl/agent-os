# Design, Illustration, and Typography Direction

Use this reference for illustration, print-inspired work, stylized 3D, logos, posters, UI mockups, diagrams, and any image where layout or text is a primary constraint.

## Choose a visual language by behavior

| Desired behavior | Useful direction |
| --- | --- |
| Clean, scalable mark | Flat vector-like shapes, few colors, strong silhouette, balanced negative space |
| Editorial concept | One immediately readable metaphor, reduced palette, clear focal hierarchy |
| Human and tactile | Loose linework, watercolor, gouache, ink wash, paper grain, or collage edges |
| Bold print character | Screen print, risograph, linocut, halftone, overprint, or limited-ink treatment |
| Polished stylized object | Stylized 3D with deliberate material finish and simple lighting |
| Technical explanation | Isometric/orthographic structure, consistent strokes, labels, leader lines, legend |
| Shippable interface | Realistic layout and states; avoid concept-art decoration |

Do not stack media terms that imply incompatible rendering. Pick one primary medium and at most a few supporting surface cues.

## Graphic layout

- Use a grid when alignment and hierarchy matter: editorial, modular, baseline, or deliberately asymmetric.
- Establish one visual anchor, then hierarchy by scale, weight, contrast, or position.
- Reserve copy space or a title-safe area before placing imagery.
- Use generous margins for restraint; tight margins or full bleed for intensity.
- Make thumbnail-scale readability an explicit goal for covers, icons, posters, and editorial metaphors.

Translate abstract feedback into layout changes. “Cleaner” may mean fewer modules, one anchor, stronger alignment, more margin, and lower background contrast. “More energetic” may mean diagonal flow, larger scale contrast, tighter crop, and a bolder accent—not arbitrary decoration.

## Typography and exact copy

Keep a canonical visible-text block:

```text
Text (verbatim; preserve characters and line breaks):
QØR-7
DON’T PANIC—SHIP IT.

No other text, pseudo-text, placeholder copy, logo, caption, date, URL, or decorative lettering.
```

- Preserve all characters, case, punctuation, diacritics, Unicode, whitespace, and line breaks exactly.
- Never autocorrect, translate, paraphrase, or improve canonical copy without permission.
- If a difficult word needs spelling or pronunciation guidance, put that guidance outside the canonical block and say it is not visible text.
- Specify text role and placement: headline, subhead, label, caption, badge, or footer; upper-left, centered, aligned to a grid, and so on.
- Describe type in broad visible terms before specialist names: neutral modern sans, humanist sans, condensed display, high-contrast serif, slab serif, monospaced, hand-lettered.
- Use tracking, leading, case, weight, and alignment only when they affect the intended hierarchy.
- Ask for high legibility and sharp rendering when text is mission-critical, then visually inspect every character in the output.

## Posters and covers

Decide whether the poster is image-led or type-led. State the exact hierarchy, copy-safe region, and permitted copy. A two-line lockup requires an explicit line break. Prohibit extra text rather than listing a large generic negative prompt.

## Diagrams and infographics

Define the audience and reading order before rendering. Use the appropriate structure—timeline, process flow, decision tree, comparison matrix, exploded view, cutaway, or cross-section. State every required label exactly. Keep callout/leader lines unambiguous, stroke weights consistent, and visual encodings explained by a legend when needed.

Generated diagrams can look polished while containing structural or textual errors. Inspect the actual output for label accuracy, arrow direction, duplicates, missing nodes, and false relationships.

## UI mockups

Specify fidelity, device/canvas, navigation model, information density, and required states. Use recognizable components such as cards, sidebar, top navigation, toolbar, modal, drawer, split view, or master-detail only when the product needs them. Include selected, hover, empty, loading, or error states when relevant.

For a shippable look, prioritize hierarchy, spacing, affordances, readable content, and realistic density. Avoid sci-fi overlays, decorative pseudo-data, and concept-art lighting unless explicitly requested.

## Stylized 3D

Choose whether the result should feel like clay, paper, soft-body form, hard-surface modeling, or photoreal CGI. Specify edge treatment, roughness, global illumination, reflections, shadow behavior, and texture scale. “3D” does not imply glossy plastic; name matte, satin, lacquer, glass, metal, fabric, or stone behavior.

## Sketch-to-image

Treat a sketch as a spatial specification unless the user wants its line style preserved:

- preserve approximate positions, hierarchy, scale relationships, perspective, negative-space regions, and text zones;
- interpret rough shapes intelligently without rearranging the layout;
- state the target medium separately;
- add no new objects or text unless authorized.

For sketch edits and reference-image role control, also read [editing-and-references.md](editing-and-references.md).
