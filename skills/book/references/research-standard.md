# Research Standard

Read this before reconnaissance; re-read it before deep research and evidence allocation.

## External, question-driven research

Every book requires meaningful external research. Model memory may suggest vocabulary, questions, and candidate sources, but it is not evidence. Reconnaissance maps the terrain broadly enough to choose the book. Deep research answers the approved book's evidence questions. Do not accumulate generic summaries or browse without a claim/question architecture.

For each research action, know what question it answers, what evidence would change the manuscript, and whether the source is discovery-only or suitable for citation.

## Source hierarchy and diversity

Prefer, contextually:

1. primary sources when appropriate;
2. peer-reviewed scholarship and scholarly books;
3. universities, archives, museums, government statistical bodies, and learned institutions;
4. specialist reference works;
5. high-quality journalism and serious long-form reporting;
6. reputable general references;
7. ordinary web pages for discovery or low-risk corroboration.

Prestige never substitutes for relevance. A specialist catalogue may outrank a broad survey for a particular artifact. Wikipedia may orient but should not anchor consequential claims. Diversify source type, institution, geography, and viewpoint when the subject warrants it; source count alone is not quality.

## Evidence ledger

Maintain one JSON object per line in `research/ledger.jsonl` with a stable claim ID, claim, status, confidence, citations and locators, source type, URL when useful, nuance, intended chapter, and whether an endnote is needed. Use at least:

- `established`
- `strong_inference`
- `supported_with_uncertainty`
- `scholarly_interpretation`
- `disputed`
- `later_tradition`
- `popular_myth`
- `unsupported`

Omit unsupported claims unless the unsupported story is itself relevant and clearly identified. Separate fact, inference, interpretation, dispute, tradition, and myth in both ledger and prose.

## Current and contested subjects

For an evolving subject, establish a precise factual cutoff, verify officeholders, quantities, policies, statuses, and releases at that date, distinguish settled history from active developments, and avoid prose that implies an unfinished story has concluded.

For contested subjects, distinguish evidence from interpretation, explain consequential disagreements, weight positions by evidence and scholarly seriousness, avoid partisan caricature and artificial balance, and represent uncertainty proportionately. Become intentionally argumentative only when commissioned to make an argument.

## Quotations, scenes, and copyright

Verify every direct quotation against a reliable source and record its locator. Quote only when wording supplies personality, immediacy, humor, rhetorical force, or direct evidence. Paraphrase ordinary facts. Use short, necessary excerpts from modern copyrighted works; never retain full source texts when notes and excerpts suffice; never imitate a living or recent author's distinctive style.

A vivid scene may contain only documented setting, known sequence, observed behavior, physical circumstances, recorded dialogue, and attested details. Do not infer thoughts, emotions, weather, gestures, room detail, sensory detail, or cinematic sequence as fact.

## Evidence packets and allocation

Before drafting each chapter, create a bounded packet containing its job, driving question, movement, chronology, required facts, people and terms, examples or documented scenes, quotation candidates, uncertainties, connections, callbacks, material not to repeat, claims needing notes, and sources. Allocate claims and evidence across chapters so the same anecdote or explanation is not rediscovered and repeated.

Use sources mostly invisibly in narrative prose. Name a scholar, institution, or document when its identity matters to interpretation, disagreement, provenance, or understanding—not merely to display research.

## Notes and bibliography

Build notes from the ledger after factual structure stabilizes. Prioritize direct quotations, disputed or surprising claims, important statistics, consequential factual assertions, and claims a skeptical reader would reasonably verify. Do not note every mundane sentence. Curate the strongest and most useful bibliography/further reading; do not dump every URL encountered.
