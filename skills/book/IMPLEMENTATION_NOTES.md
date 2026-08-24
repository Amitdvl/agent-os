# Implementation Notes

## Apple Books smoke test — 2026-08-24

Environment: Apple Books on macOS 26.5.2, Pandoc 3.10.2, EPUBCheck 5.3.0.

Fixture: `tests/fixtures/sample-manuscript.md`, built through `scripts/build_epub.py` and imported into Apple Books.

Passed checks:

- title and subtitle render on the title page;
- generated contents list all major sections and chapter navigation works;
- Pandoc notes open in the Apple Books note popover;
- the generated semantic return backlink returns to the source paragraph;
- increased font size reflows without clipping or fixed-width behavior;
- Paper/Light and dark appearances remain legible without forced body colors;
- chapter and title layouts remain readable at the tested window size.

The first pass revealed two reader-level issues that automated validation did not catch: Pandoc 3.10 omitted footnote return backlinks, and a global `h1` break hint inserted a blank page before the title. The builder now repairs missing semantic backlinks before EPUBCheck, and the redundant heading break was removed. The rebuilt fixture passed the checks above.

## Behavioral acceptance — 2026-08-24

Explicit `$book` discovery and the single approval gate were exercised through the Codex CLI. Eight isolated subjects reached the gate without creating manuscript or chapter content, including historical, scientific, geographic, contemporary, and ambiguous topics.

A full approved production pilot completed on “Why Humans Have Weekends”:

- live external research produced a 33-claim ledger and eight chapter evidence packets;
- the final manuscript contains 13,652 body words, eight chapters, 14 notes, and a selected bibliography;
- all nine required editorial passes were recorded;
- the mechanical gate finished with 0 errors and 0 warnings;
- EPUB packaging produced `why-humans-have-weekends.epub` with EPUBCheck 5.3.0 reporting 0 errors and 0 warnings both during the build and from the delivered path;
- structural inspection confirmed EPUB 3 metadata, navigation, CSS, working note/backlink pairs, and no remote resources, scripts, embedded fonts, fixed layout, DRM, or invented creator metadata;
- the delivered SHA-256 matched the build receipt, and guarded cleanup removed only the verified run workspace while preserving the EPUB.
