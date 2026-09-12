---
name: pamphlet
description: Create researched 300–1,000-word knowledge pamphlets as finished PDF and Markdown files. Use for /pamphlet, $pamphlet, or an explicit request to produce a Pamphlets knowledge sprint.
---

# Pamphlet

Treat the input as a subject or question, with any natural-language constraints. Deliver a compact, coherent unit of understanding centered on information and context. Use the commission's language. This is the small-scale sibling of Book, with an explanatory architecture chosen for the subject.

## Start with reader choices

Before researching or drafting, use the host's `askUserQuestion` tool to collect these three choices together:

1. What does the reader want to understand by the end?
2. What prior knowledge should the explanation assume?
3. One pamphlet or multiple pamphlets? If multiple, how many, or may the agent choose a compact series?

Tailor the choices to the subject and allow free text. These answers are per commission, never fixed defaults or inferred from past readers. Reuse answers already explicitly supplied for this commission; ask only for missing answers. Do not repeat an answered question.

Tool adaptation: when `askUserQuestion` is not exposed, use `request_user_input_async` (all missing questions in one call), or `request_user_input` only in a mode that permits it. If no permitted question tool is available, ask all missing questions in one numbered message. Wait for actual answers; preselected options and elapsed time are not answers. With asynchronous tools, independent environment preflight is allowed while waiting, but do not start commission-dependent research or writing.

If the subject itself is missing, include it in the same intake. Once the intake is complete, work autonomously through delivery without a conception or draft approval checkpoint. Ask again only for a material ambiguity that prevents honoring the commission.

## Scope and architecture

- Honor the requested breadth. A broad subject calls for a compact overview with honest limits, not a silently substituted narrow subject. For multiple pamphlets, distribute the requested coverage into complementary units; do not invent a series when the reader selected one.
- Choose a clear learning objective from the reader's answer. Include essential orientation and context, then order concepts so prerequisites precede their use. Choose headings for this particular subject; do not force a universal template.
- Use connected explanatory prose, with occasional headings, lists, or comparisons when they improve understanding. Examples and analogies belong only when they add explanatory value. Do not force or prohibit them. Narrative hooks, scenes, and storytelling are not the organizing principle.
- Choose length according to the subject and learning objective within **300–1,000 words per pamphlet**. No fixed target. The title and source references are excluded; all explanatory prose, section headings, examples, and any learning aids count. Never hide explanatory content in the references to evade the limit.
- Do not add a mandatory quiz, recap, glossary, or next-topic list. Add learning aids only when requested. Avoid padding, repeated conclusions, forced cleverness, and unsupported certainty.

## Research, writing, and review

Use external research for every pamphlet. Prefer primary documentation, scholarship, and authoritative subject-specific sources. Research to answer the learning objective, not to satisfy a source-count quota. If research access is unavailable, report that blocker rather than generating an ungrounded publication.

Keep a compact temporary record mapping consequential claims to sources. Verify names, numbers, quotations, mechanisms, and important distinctions. For evolving subjects, verify current claims and state a factual cutoff when relevant. Represent meaningful uncertainty and disagreements in proportion to evidence. For a series, track what each unit teaches and keep terminology consistent without wasting words on repeated introductions.

Draft, then review the whole pamphlet for understanding, missing context, accuracy, scope, repetition, and prose clarity. Do not deliver the first draft without revision. Finish with a short `## Sources` section of useful titled links. Use a concise source note for a disputed or consequential claim when needed; integrate its explanation into the counted body, not an uncounted essay in the sources. Use inline source links if a note needs a direct locator.

## Build and deliver

Read [delivery.md](references/delivery.md) for the supported Markdown, runtime requirements, and build/validation commands before authoring the final manuscript. Resolve scripts relative to this installed skill directory, not the current project or a copied slash-command stub. On hosts with a separate commands directory, find the matching `skills/pamphlet` package.

Default destination: `~/Desktop/Pamphlets`, unless the commission specifies another destination. Keep research, drafts, QA notes, staged exports, and page images in one uniquely created temporary workspace. Never store them in the library or portable skill source.

Deliver a matching PDF and Markdown pair per pamphlet. Check the word limit mechanically, reopen the PDF and compare its text, render and visually inspect every page, and repair any clipping, missing glyphs, awkward layout, or broken links before publication. Use the helper's collision-safe publication; never overwrite an existing output. After verifying all delivered pairs, remove only this run's temporary workspace. On failure, preserve recoverable working state and report the blocker without claiming delivery.

Report the title, body word count, and clickable PDF/Markdown outputs briefly. Keep only finished PDF and Markdown publications in the library; project instructions may live alongside them. Do not auto-open, import, send, or remotely publish pamphlets unless requested.
