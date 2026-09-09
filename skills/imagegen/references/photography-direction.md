# Photography Art Direction

Use this reference for photorealistic images, camera-like CGI, portraits, products, food, architecture, documentary scenes, and cinematic environments. Translate the user’s desired effect into visual operations; do not recite vocabulary.

## Composition and camera

| Desired effect | Useful direction | Consequence |
| --- | --- | --- |
| Iconic, controlled subject | Centered or symmetrical; clean silhouette | Stable and deliberate, often suited to product heroes. |
| Natural editorial energy | Slightly off-center; asymmetrical balance | Feels observed rather than mechanically staged. |
| Room for interface or copy | Place subject on one third; reserve negative space | Protects readability outside the generated image. |
| Environmental scale | Wide view with foreground, midground, background | The world contributes to the story. |
| Intimacy and detail | Close framing; eye-level or shoulder-height view | Feels physically near and human. |
| Monumentality | Low camera angle | Makes the subject feel larger or more powerful. |
| Vulnerability or overview | High angle | Makes the subject feel smaller or clarifies layout. |
| Orderly product/food layout | Top-down view | Emphasizes shape, spacing, and graphic arrangement. |
| Natural space | Normal-lens feel | Familiar proportions and moderate depth. |
| Immersive environment | Wide-angle feel | Expands near/far scale; can distort edges. |
| Elegant separation | Long-lens feel | Compresses depth and quiets the background. |
| Fine surface study | Macro or detail shot | Prioritizes texture and small construction details. |

Use exact lens numbers only when the user supplies them or technical matching requires them. Describe spatial behavior first.

Depth of field controls attention: deep focus keeps the system/environment readable; soft background separation isolates the subject without showy blur; razor-thin focus is a strong stylization and should be deliberate.

## Lighting and mood

Describe a believable source, direction, softness, color, and purpose.

| Desired effect | Useful direction | Consequence |
| --- | --- | --- |
| Natural and credible | Motivated window or practical light | Light appears to come from the depicted world. |
| Soft and approachable | Broad diffused key with gentle fill | Smooth transitions and restrained texture. |
| Sculptural and dramatic | Directional side key with negative fill | Clear form, darker shadow side, stronger tension. |
| Clean commercial object | Controlled key, fill, rim, contact shadow | Clear edges and readable material response. |
| Airy and optimistic | High-key, low shadow ratio | Bright, open, low-drama image. |
| Intimate or tense | Low-key, practical-heavy light | Shadow carries mood and attention. |
| Warm human moment | Warm practicals with cooler ambient light | Natural color contrast and depth. |
| Dawn/dusk atmosphere | Golden-hour or blue-hour direction | Low-angle warmth or cool twilight calm. |

Avoid disconnected glow. Keep shadow direction, shadow softness, reflections, bounce light, and color spill consistent with the stated sources. Use rim light, bloom, haze, lens flare, and visible light beams only when they support the concept.

## Color and tonal structure

- **Muted / restrained:** lower saturation and fewer competing accents; often feels editorial and composed.
- **Vivid:** higher saturation and separation; useful for playful or kinetic work, but easier to make cluttered.
- **Limited palette:** a dominant family plus one accent; strengthens hierarchy.
- **Monochromatic / duotone:** strongly graphic, with less material color information.
- **Warm highlights and cool shadows:** creates depth without indiscriminate saturation.
- **Protected highlights:** preserves detail in bright materials and skin.
- **Lifted blacks:** softer, film-like shadows; **rich blacks:** denser, cleaner contrast.

Translate mood into observable choices. “Serene” might mean stable framing, soft directional light, a quiet palette, and still air. “Tense” might mean harder side light, more shadow, diagonal flow, and constrained space.

## Materials and realism

Describe how a surface reacts to light:

- matte: broad, subdued highlights;
- satin: controlled soft sheen;
- glossy: clear bright reflections;
- brushed metal: directional reflections and fine machining texture;
- frosted or translucent: diffused light transmission;
- glass: refraction, internal reflections, and coherent highlights;
- fabric: weave, tension, seams, folds, and gravity;
- stone or wood: scale-appropriate grain, roughness variation, and edge behavior.

For credible realism, prioritize coherent shadows and reflections, contact grounding, edge integrity, natural roughness variation, optical plausibility, and subtle imperfections. Add micro-language only where physically appropriate: fine machining marks, natural fabric tension, irregular condensation, slight edge wear, or realistic stitching.

## Domain cues

### Portraits

Specify expression and body language in ordinary words. Preserve natural skin texture, complexion variation, believable hands, and restrained retouching unless a beauty treatment is requested. Environment should support rather than compete with the face.

### Products and food

Protect product geometry, packaging, labels, and silhouette. Use realistic contact shadows and physically plausible reflections. For food, favor appetizing surface behavior—steam, glaze, crumb texture, caramelization, condensation—without making everything wet or glossy.

### Architecture and interiors

Choose whether the goal is lived-in, staged, gallery-like, warm minimal, material-forward, or technical. Keep geometry constructible, verticals intentionally corrected or converging, and human-scale cues believable.

### Documentary and cinematic work

Documentary direction favors available or motivated light, natural asymmetry, candid gesture, and environmental context. Cinematic direction should describe blocking, scale, light sources, and story tension rather than relying on the word “cinematic.” Film grain, halation, flare, or anamorphic behavior are treatments, not substitutes for composition.

## Canvas consequences

- `1:1`: balanced or iconic; preserve even breathing room.
- `4:5` or `3:4`: portrait/editorial; reserve deliberate top or side copy space when needed.
- `16:9`: environmental or cinematic; use horizontal depth and thirds.
- `9:16`: strong top-to-bottom hierarchy; avoid placing the focal point where UI overlays may cover it.
- Banner/panoramic: keep one clear anchor and protect a wide copy-safe region.

The API supports specific canvas sizes. Preserve the requested ratio as compositional intent, then choose a supported size from [image-api.md](image-api.md); do not claim arbitrary native output sizes that the execution path does not support.
