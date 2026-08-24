# Revision and QA

Read this after the first complete draft. The manuscript is raw material until every pass below is complete and recorded in `run.json` and the workspace QA files.

Editorial judgment decides whether the book works. Deterministic scripts detect mechanical risks; they do not certify conception, truth, style, or bookness.

## 1. Structural revision

Test the approved conception, reader transformation, necessity and job of every chapter, proportional space, momentum, scope drift, setup and payoff, and connections that exist only in the author's head. Move, merge, split, cut, bridge, expand, or rewrite freely. A polished paragraph in the wrong book is still wrong.

## 2. Factual verification

Verify dates, names, titles, offices, chronology, quantities, mechanisms, technical explanations, quotations, attribution, causal claims, disputed claims, current facts, and cutoff date after structural changes. Trace consequential claims to the evidence ledger. Return to research when evidence is inadequate.

## 3. Chronology, name, and terminology consistency

Audit spelling, transliteration, titles, abbreviations, dates, sequence, terminology choices, and introductions. Ensure a person or concept is not repeatedly presented as new and that deleted passages left no dangling reference.

## 4. Repetition audit

Find repeated facts, anecdotes, quotations, explanations, metaphors, transitions, sentence shapes, chapter-opening tricks, chapter-ending tricks, and conspicuous phrases. Preserve intentional motifs; cut accidental recurrence and redistribute necessary reminders with proportion.

## 5. Cross-chapter continuity

Use `continuity.md` to verify callbacks, recurring threads, promises, conceptual dependencies, open questions, chronology, and chapter-to-chapter momentum. Repair contradictions, broken payoffs, knowledge resets, and links to removed material.

## 6. Prose-style revision

Re-read the prose standard. Edit sentence by sentence and paragraph by paragraph for precision, concreteness, cadence, clarity, warmth, economy, appropriate wit, and adaptive mode. Remove false profundity, empty emphasis, generic transitions, over-signposting, cliché, rhetorical mannerisms, and monotonous symmetry.

## 7. Notes and source audit

Verify every quotation and note locator. Ensure surprising, disputed, statistical, and consequential claims are traceable; remove performative over-citation. Confirm uncertainty in prose matches the ledger and curate the bibliography to the best useful sources.

## 8. Mechanical manuscript validation

Run `scripts/manuscript_checks.py` with the production word range and save `qa/mechanical.json`. Repair all errors. Review every warning editorially rather than automatically suppressing it. The script's word count excludes YAML metadata, footnote definitions, and bibliography/further reading.

## 9. Final editorial read

Read the book linearly as a very intelligent general reader. Ask whether the subject is genuinely understood, the reading experience remains pleasurable, the work feels composed as one book, important claims are trustworthy, the scope feels curated, the voice is coherent but adaptive, and removing another 5–10 percent would improve it. Cut when warranted.

## Adversarial reviewers

Use bounded subagents when available for independently checkable criticism: structural audit, intelligent-reader audit, chronology audit, quotation verification, causal-claim challenge, source-quality review, duplicate fact/anecdote detection, AI-mannerism audit, and fact-risk audit. Do not disclose a desired conclusion. Ask for concise findings with locations, evidence, severity, and confidence. The main author decides, integrates, and re-verifies every accepted change.

## Completion record

Before packaging, record each pass as complete with timestamp and concise evidence. A checkbox without performed work is not evidence. Any material post-pass rewrite invalidates affected later passes and requires rerunning them.

Use these stable `run.json.revision_passes` keys so cleanup can verify the full
release gate: `structural_revision`, `factual_verification`,
`chronology_name_terminology`, `repetition_audit`,
`cross_chapter_continuity`, `prose_revision`, `notes_source_audit`,
`mechanical_validation`, and `final_editorial_read`. Each value must be `true`,
`"complete"`, or an object whose `status` is `complete`, `completed`, or
`passed`; an object should also retain its timestamp and concise evidence.
