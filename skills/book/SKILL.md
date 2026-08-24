---
name: book
description: Create a deeply researched, human-readable 10,000–30,000-word nonfiction book from a subject, with one editorial approval gate and final validated EPUB delivery. Use only when explicitly invoked with $book.
---

# Book

Act as the researcher, author, editor, fact-checker, and publisher of one coherent short nonfiction book. Treat everything after `$book` primarily as a subject commission, including any natural-language constraint. Do not expose formal flags or turn the commission into a configuration interview.

The promise is one evidence-grounded, enjoyable, unified 10,000–30,000-word book for a very intelligent general reader, delivered as a validated EPUB in `~/Desktop/books/`. Write in the commission's language. Use the shortest natural length that feels complete.

## Hard invariants

- Research externally on both sides of the editorial gate. Model memory may orient questions but is never the factual foundation.
- Present one compact conception for explicit approval before substantial drafting. Do not draft chapters while waiting.
- After approval, proceed autonomously unless new evidence makes the approved commission fundamentally incompatible with reality.
- Give the book one cumulative, subject-specific spine. Do not assemble separately authored chapter essays.
- Centralize authorship: you write and integrate all major final prose and revise the manuscript as a whole.
- Never fabricate scenes, thoughts, dialogue, emotions, weather, sensory detail, or sequencing beyond the evidence.
- The first complete draft is not deliverable. Perform every revision and verification pass.
- Use restrained Pandoc footnotes and a curated bibliography. Do not create a duplicate Notes chapter.
- Never overwrite an existing EPUB. A successful run removes only its own workspace after verified delivery; a failed run preserves recoverable state.
- Never claim completion without a mechanically clean 10,000–30,000-word narrative body, zero EPUBCheck errors, zero unresolved warnings, a reopened and verified final package, and successful workspace cleanup.

## Required phase order

Execute every phase, moving backward when repairs require it:

`PREFLIGHT → RECONNAISSANCE → CONCEPTION → EDITORIAL_GATE → DEEP_RESEARCH → EVIDENCE_BUILD → DRAFT → STRUCTURAL_REVISION → FACT_CHECK → CONTINUITY_QA → PROSE_REVISION → NOTES_AND_BIBLIOGRAPHY → FINAL_QA → EPUB_BUILD → EPUB_VALIDATE → DELIVER → CLEANUP`

Record every transition atomically in `run.json` with `scripts/workspace.py update`. Store decisions, evidence summaries, status, and outputs—never private chain-of-thought.

## Preflight and workspace

1. Reject an empty subject.
2. Prove at least one external research path with a small authoritative lookup. Stop if external research is unavailable.
3. Run `python3 scripts/preflight.py --destination "$HOME/Desktop/books" --json`. Stop early with the narrow remedy if Pandoc, EPUBCheck, temporary storage, required skill files, or destination access is unavailable.
4. Create the run with `python3 scripts/workspace.py create --subject "<subject>" --destination "$HOME/Desktop/books" --json` and retain the absolute workspace path.
5. Keep research notes, evidence packets, chapters, QA records, build output, and operational state inside that workspace. Do not retain full copyrighted sources or secrets.

Before reconnaissance and conception, read [editorial-standard.md](references/editorial-standard.md) and [research-standard.md](references/research-standard.md).

## Reconnaissance, conception, and the one gate

Map the terrain broadly, test obvious myths, identify uncertainties and evidence types, and generate several plausible conceptions internally. Select the conception that best balances understanding, importance, interest, coherence, and movement. Define the spine, reader transformation, scope, exclusions, chapter jobs, and natural target length.

Write `editorial-brief.md`, set `current_phase` to `editorial_gate`, and present only this compact brief:

- proposed title and optional subtitle;
- **The book:** the central conception;
- **Scope:** coverage and important exclusions; for a current or evolving subject, include the explicit factual cutoff date;
- **Organizing principle:** the subject-specific spine;
- **Expected length:** a natural 10,000–30,000-word estimate;
- **Contents:** chapter titles in reading order;
- **Why this approach:** one or two short paragraphs;
- **Proceed?**

Stop. Do not research deeply or draft chapters while awaiting approval.

On an explicit `yes`, `approved`, `proceed`, or equivalent, record the exact text and timestamp with `workspace.py update --approval-text`, set `approved_conception: true`, transition to `deep_research`, and continue without reopening foundational choices. Approval permits autonomous improvements to title, chapter boundaries, order, examples, emphasis, and final length when the approved conception remains intact.

## Research and evidence

Re-read [research-standard.md](references/research-standard.md). Turn the approved architecture into evidence questions. Maintain `research/ledger.jsonl`, chronology and open questions, and one bounded evidence packet per chapter. Allocate claims, sources, uncertainties, quotations, myths, and callbacks before drafting. For current topics, record an explicit factual cutoff.

Subagents may perform bounded, read-heavy reconnaissance, quotation verification, chronology audits, source-quality review, myth checking, fact-risk review, or adversarial criticism. Ask for distilled findings with sources and confidence. Do not assign final chapters to separate agents, merge raw subagent prose, or delegate the book's conception and authorial voice.

## Drafting and revision

Before drafting, read [prose-style.md](references/prose-style.md). Draft centrally, normally in reading order, from bounded evidence packets. Update `continuity.md` after each chapter with established concepts, people, chronology, terminology, motifs, promises, used anecdotes, open questions, potential repetitions, and available callbacks.

After the complete draft, read [revision-and-qa.md](references/revision-and-qa.md) and re-read [prose-style.md](references/prose-style.md). Record completion of all nine passes: structural revision; factual verification; chronology/name/terminology consistency; repetition audit; cross-chapter continuity; prose revision; notes/source audit; mechanical validation; final editorial read. Return to research or drafting whenever a pass exposes a real gap.

Build restrained notes from the evidence ledger, verify every quotation, and curate the strongest useful bibliography rather than listing every encountered URL.

## Finalization, EPUB, and delivery

Before finalization, read [epub-standard.md](references/epub-standard.md) and inspect `--help` for `scripts/manuscript_checks.py`, `scripts/build_epub.py`, and `scripts/workspace.py`.

1. Assemble `manuscript.md` and authoritative `metadata.yaml` in the workspace.
2. Run `manuscript_checks.py` with `--metadata metadata.yaml`, the production 10,000–30,000 range, and `qa/mechanical.json` as its report. Repair every error and review every warning.
3. Set `epub_build`; run `build_epub.py --validate` with the bundled CSS and the workspace `build/` directory. Validation is mandatory. The script refuses delivery on every EPUBCheck error or warning and writes the diagnostic log inside the workspace.
4. If EPUBCheck reports a warning, inspect it, repair the cause, and rerun the build. Do not bypass validation or deliver a merely plausible package.
5. Reopen the delivered EPUB as a package and confirm EPUB 3 metadata, title, navigation, CSS, chapter entries, semantic notes/backlinks, no remote resources, and positive file size.
6. Record final word count, chapter count, all nine canonical revision-pass keys, final path, validation counts, and delivery state in `run.json`. Preserve the builder's hash-bearing `build/build.json` receipt.
7. Clean only this recognized workspace with `workspace.py cleanup --require-delivered --json`.

If an unrecoverable error remains, atomically mark the run `failed`, store a concise error object, preserve the workspace, report its path when useful, remove no recoverable work, and leave no partial EPUB in the destination.

On success, report only:

```text
Finished: <Final Title>
<absolute EPUB path>
<body word count> words · <chapter count> chapters
```
