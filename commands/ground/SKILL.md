---
name: ground
description: Use when the user invokes /ground or naturally asks to ground, save, distill, extract, or turn one valuable source into a concise, source-linked OS Library entry that is easy to retrieve and apply.
---

# Ground

Use this workflow to distill a single source into a retrieval-first knowledge
record in the user's OS Library. `/ground` is the compact form; it is not a
requirement.

## Usage

```text
/ground <URL | file path | Notion page | pasted text>
/ground <source> --title "optional title" --domain "optional domain"
```

## Natural-language activation

Treat a clear request to preserve and distill one supplied source as grounding,
even when the user does not type `/ground`. Examples include:

- “Ground this.”
- “Save this to OS.”
- “Pull out the useful parts and keep it for later.”
- “Turn this video/article/note into a reusable playbook.”

Use the same workflow, classification, storage, and output contract. If no
source is identifiable in the current message or attached context, ask for the
one source to ground; do not guess which earlier item the user means.

The source may be a YouTube video, X article/thread, essay, playbook, personal
note, video file, PDF/document, image, or other supplied material. Process
one source per invocation. Do not bulk import a folder, playlist, feed, or thread
collection without an explicit follow-up request.

## Operating Principle

Optimize for future retrieval and application, not exhaustive summarization.
Classify by the question or decision the material helps answer; retain the
source format only as supporting metadata. Do not turn weak material into an
authoritative-looking record.

## The V.A.L.U.E. Formula

Apply this compact classification to every grounded item:

- **V — Value:** leverage from 1 to 5. `1` is a useful detail; `3` changes a
  recurring decision; `5` is a durable principle, unusually strong playbook,
  or high-upside insight.
- **A — Area:** choose one primary domain and, only when necessary, one
  secondary domain. Prefer stable nouns such as Strategy, Product, Growth,
  Sales, Writing, Psychology, Health, or Tools.
- **L — Lens:** source format: Video, X article/thread, Essay, Playbook,
  Personal note, File, Audio, or Other.
- **U — Use:** a concrete retrieval cue phrased as a question, situation, or
  decision. Example: “How do I validate a product idea before building?”
- **E — Evidence:** preserve the canonical source URL or file; label
  confidence as Raw, Interpreted, or Validated, and set a review date only
  when freshness matters.

Use at most three tags. The title, Area, and Use cue do most of the retrieval
work; tags are a last-mile aid, not a taxonomy.

## Source Handling

1. Identify the source and use the narrowest suitable read-only tool.
   - Public YouTube: inspect metadata and, when available, subtitles with
     `yt-dlp`; use one exact URL and `--no-playlist`.
   - X: prefer the applicable local archive or the live `twitter` CLI; do not
     inspect cookies or use browser automation to bypass access controls.
   - Notion: use the Notion CLI when the target has been shared with the Codex
     Notion Agent; otherwise say exactly what needs sharing.
   - Local files: read only the user-supplied file and extract text or inspect
     metadata with the appropriate local capability.
2. Separate direct evidence from interpretation. Cite timestamps, page/section
   references, or short excerpts when they materially support a claim.
3. Extract only the durable thesis, claims, tactics, examples, caveats, and
   retrieval cues. If the source is thin, say so and assign a lower Value or
   recommend not saving it.

## OS Library Record

When the OS Library is available, create one record with:

```text
Title
Status: Grounded
Format (Lens)
Area
Value
Confidence
Source URL/File
Use / retrieval cue
Tags (0–3)
```

Write this body in the record:

```markdown
## Value card
**Thesis:** [one sentence]
**Use when:** [retrieval cue]
**Why it matters:** [one or two sentences]

## Grounded takeaways
- [3–7 atomic claims or tactics]

## Application
- [the smallest concrete action, decision rule, or playbook]

## Caveats
- [limits, uncertainty, contradictions, or freshness risk]

## Source
[canonical source and evidence pointers]
```

Preserve the raw source. Never replace it with the distillation, fabricate a
source, or imply validation beyond the available evidence.

## Output Contract

After saving, respond with a five-line value card:

```text
Grounded: [title]
Value: [1–5] · [Area] · [Format] · [Confidence]
Use when: [retrieval cue]
Thesis: [one sentence]
Saved: [OS Library link or the exact blocker]
```

If saving is blocked, still provide the completed value card and name the
single action needed to unblock it. Never ask the user to manually fill a
long metadata form.
