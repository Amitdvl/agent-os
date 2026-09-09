# Diagnosis and Iteration

Use this reference after an output exists or when the user gives subjective feedback. Diagnose the underlying visual dimension instead of answering one vague adjective with another.

## Response pattern

1. Preserve accepted state and identify the likely failing dimension.
2. Explain the visible cause in plain language.
3. Offer 2–3 materially different corrections with visible consequences.
4. Recommend one based on the stated purpose.
5. After the user chooses, change only the relevant state variable and repeat invariants.

Do not immediately reconcept the whole image unless the user asks. Do not offer more than three competing directions.

## Common diagnoses

### “It looks too AI”

Likely causes include excessive bloom, rim light, fog, bokeh, decorative clutter, implausible shadows/reflections, uniformly perfect surfaces, over-smoothed skin, or disconnected lighting.

Possible directions:

- **More observational:** natural asymmetry, motivated light, moderate focus, fewer decorative elements.
- **More physically grounded:** coherent shadows/reflections, contact grounding, roughness variation, plausible wear.
- **More restrained:** less bloom/fog/rim light, quieter palette, clearer hierarchy.

### “It’s too glossy”

The issue is usually material response, not color. Offer matte or satin roughness, smaller/softer highlights, material-specific microtexture, or fewer mirror-like reflections. Preserve product geometry and lighting structure unless explicitly unlocked.

### “It’s too busy”

Reduce secondary props, strengthen one focal point, increase negative space, subordinate the background, simplify the palette, or tighten information hierarchy. Do not remove required content.

### “Make it more premium”

Clarify premium through restraint, spacing, hierarchy, controlled light, material fidelity, refined edges, and fewer arbitrary elements. Offer purpose-specific directions such as quiet editorial restraint, precise technical luxury, or warmer crafted tactility. Do not default to black-and-gold, marble, neon, or generic luxury clichés.

## Other symptom mappings

| Symptom | Likely dimension | Targeted moves |
| --- | --- | --- |
| Generic | Purpose, camera relationship, hierarchy | Define use, viewpoint, focal order, and one distinctive material/light relationship. |
| Flat | Depth and light | Separate depth planes, add side light, contact shadows, occlusion, or local contrast. |
| Plastic | Material realism | Add roughness variation, microtexture, subtle imperfections, and believable highlight roll-off. |
| Over-retouched portrait | Skin/lighting | Restore pores, complexion variation, fine lines, restrained retouch, and softer highlight behavior. |
| Subject drift | Edit state | Repeat identity, geometry, camera, crop, and all-unmentioned-elements invariants. |
| Weak text | Typography/output | Reassert canonical copy, hierarchy, placement, contrast, and no-other-text exclusions. |
| Clumsy composite | Integration | Match scale, perspective, occlusion, light direction, shadow softness, color spill, and focus. |

## Lock-and-refine sequence

Do not force every image through every pass. Use the next pass only when the previous dimension is working:

1. **Concept:** subject, purpose, and visual idea.
2. **Composition:** silhouette, placement, crop, hierarchy, negative space; lock when accepted.
3. **Lighting:** source, direction, softness, fill, edge separation, grounding.
4. **Materials:** roughness, texture, reflections, refraction, seams, wear.
5. **Palette:** dominant/secondary/accent relationships and tonal structure.
6. **Typography:** exact copy and placement without moving locked imagery.
7. **Polish:** edge integrity, microdetail, highlight roll-off, coherent reflections/shadows; no redesign.

When a user says “the composition is right; lock it,” preserve subject identity, geometry, camera, crop, spatial arrangement, and focal hierarchy. A later warmth request changes lighting temperature only. A later “less glossy” request changes roughness/specular behavior only. State these deltas explicitly.

## Inspection integrity

Inspect the actual artifact before claiming visual correctness. A successful API response or a well-formed prompt does not prove subject fidelity, exact text, composition, or invariant preservation. If the artifact is unavailable or opaque, say what was verified (request construction or file creation) and what remains visually unverified.
