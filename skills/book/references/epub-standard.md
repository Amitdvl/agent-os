# EPUB Standard

Read this before manuscript finalization, build, validation, delivery, and cleanup.

## Canonical source format

Assemble UTF-8 Pandoc Markdown with authoritative metadata in a separate `metadata.yaml`. The build utility strips embedded frontmatter from its normalized manuscript copy, so the external metadata file deterministically wins. Include title, optional subtitle, BCP-47 language, unique identifier, date/cutoff where appropriate, and modification timestamp. Include creator only when the user supplied one or an explicit configured value exists; never invent author, publisher, or imprint identities.

Use top-level `#` headings for introduction/prologue, chapters, conclusion/epilogue, and bibliography/further reading; use deeper levels without skipping hierarchy. Normal order is title page, generated navigation, optional introduction, chapters, optional ending, then bibliography/further reading.

## Notes and bibliography

Use Pandoc Markdown footnotes such as `[^ch03-04]`, prefixing source IDs by chapter for maintainability. Do not author a separate Notes chapter. Top-level chapter splitting must place notes with their chapter, mark semantic noterefs/footnotes, and provide working return backlinks. The build utility repairs missing backlinks in current Pandoc output before EPUBCheck, but integration tests must keep proving the behavior.

Keep notes concise and source-oriented. End with a curated bibliography/further-reading section, not a research dump.

## Build contract

Use `scripts/build_epub.py` with Pandoc as renderer, EPUB 3 output, smart Markdown, generated TOC to depth 2, split level 1, authoritative metadata, bundled CSS, EPUBCheck validation, package inspection, and collision-safe atomic delivery. Build candidates stay inside the run workspace.

The result must be reflowable EPUB 3 with no scripting, remote resources, embedded fonts, DRM, fixed layout, or print-page simulation. A cover is not required in v1. Major sections must appear in navigation. The package must contain expected title/metadata, OPF package document, navigation document, bundled CSS, semantic notes/backlinks, and no invented creator metadata.

## CSS and Apple Books priorities

Use relative units and restrained hierarchy. Never force body font, text color, background, fixed width/height, embedded fonts, or layout hacks. Support small screens, large accessibility fonts, light/dark themes, block quotations, epigraphs, notes, bibliography, and legible scene breaks. Use chapter break hints conservatively and avoid widow/orphan rules that fight reading systems.

Standards-based Apple Books compatibility is the primary target. Do not introduce Apple-proprietary behavior when EPUB 3 semantics work.

## Validation and warning disposition

Require zero EPUBCheck errors and zero unresolved warnings. Preserve the validation log. The production builder treats every warning as a blocking diagnostic so it can be inspected and repaired before any destination copy exists; never bypass validation to manufacture a release. Do not deliver a rejected candidate.

After atomic delivery, reopen the final file as ZIP/EPUB and repeat the structural inspection. Verify positive file size and exact final path. Never overwrite an existing book; increment a clean numeric suffix automatically, including for non-Latin titles and punctuation-heavy titles.

## Cleanup

Delivery order is: build candidate; run/confirm manuscript checks; run EPUBCheck; stop and repair any warning; atomically copy without overwrite; verify final file and package; retain the hash-bearing build receipt; record delivery; clean the recognized successful workspace; report completion. On failure, leave no partial destination file, mark the run failed, and preserve the workspace.
