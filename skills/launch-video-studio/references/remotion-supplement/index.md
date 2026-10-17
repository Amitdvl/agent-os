# Remotion supplemental recipes

Use this only for an explicitly selected Remotion project. The installed Remotion
plugin owns current API, creation, captions, rendering and performance guidance.
These retained concepts supplement that guidance; verify APIs against the project's
installed version before using code. They do not select or install a video stack.

## Deterministic map scenes

Keep map layout, camera position and overlays a pure function of the video frame.
Preload fonts, styles, tiles and geographic data before releasing render readiness;
fail clearly on unavailable assets. Disable interactive animation and transitions
that depend on wall time. MapLibre-specific integrations need their own readiness
and cleanup handling; use current plugin map guidance for the selected renderer.
Keep attribution and licensing visible where required.

## Text motion

For a typewriter effect, derive the visible grapheme count from the frame and a
fixed reveal interval; do not slice UTF-16 units through emoji or combined text.
Keep a full-text layout layer when reflow would move neighboring elements. For
word emphasis, use stable token boundaries and explicit active-word timings. Derive
opacity, transform and color from the frame so seeking reproduces the same image.
Do not use CSS animation clocks or setTimeout to advance video text.

## Captions and trims

Normalize transcript timestamps once at the boundary, preserving the documented
unit. Import captions through the official caption workflow and verify timing with
sampled rendered frames and audio. A trim shifts the media's source start; scene
placement shifts its timeline start. Keep those concepts separate. Convert seconds
to frames using the composition fps, round intentionally, and bound the visible
sequence duration against available source media. Check the installed video's API
for whether each parameter expects frames or seconds.

## Retention notes

The retired standalone package repeated official guidance for 3D, audio, fonts,
composition, sequencing, assets and rendering. Those copies are superseded by the
installed plugin. Its MapLibre, typewriter/word emphasis, caption normalization and
trim concepts are retained here without outdated code or a second global router.
No removed standalone package, its assets or runtime is required. This is an
independently authored summary of the retired local recipe concepts.
