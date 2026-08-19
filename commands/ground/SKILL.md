---
name: ground
description: Use when the user supplies one or more sources and asks—or clearly implies—that they should become study-ready, memorable, reusable, source-linked knowledge. Recognize the intent semantically; `/ground`, “Ground these,” and “Save this to OS” are examples, not required wording.
---

# Ground

Use this workflow to distill supplied sources into retrieval-first knowledge
records in the user's OS Library. `/ground` is the compact form; it is not a
requirement.

## Usage

```text
/ground <URL | file path | Notion page | pasted text>
/ground <source> --title "optional title" --domain "optional domain"
```

## Natural-language activation

Recognize grounding by **semantic intent, not by a fixed phrase**. Activate
this workflow when both are true:

1. One or more concrete sources are supplied or unambiguously referenced in
   the current context; and
2. The user asks—or the request plainly implies—that the material should be
   turned into durable knowledge for studying, understanding, remembering,
   applying, deciding, or saving.

Examples that must activate the workflow include “Ground this,” “Ground
these,” “Save this to OS,” “make these study-ready,” “turn this into something
I’ll remember,” and a source followed by context such as “for studying and
understanding this concept.” These are examples only: match the job the user
wants done, even if none of these words appear.

Do not activate merely because a source appears in a casual conversation or
because the user asks a narrow factual question about it. If a concrete source
and a durable-learning or reuse intent are both present, activate without
asking the user to type `/ground`. If the source is not identifiable, ask for
the specific source; do not guess which earlier item the user means.

The source may be a YouTube video, X article/thread, essay, playbook, personal
note, video file, PDF/document, image, or other supplied material. Process
each distinct source as its own record. A message may contain several clearly
delimited sources (for example, two links after “Ground these”); apply the
workflow to each of them in that invocation. Do not bulk import a folder,
playlist, feed, or thread collection without an explicit follow-up request.

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

## OS Order Contract

Grounding owns organization. The user should never have to file, rename, tag,
or clean up a grounded item.

- Store every source as its own material page. Never combine two sources in one
  page, even when they are closely related.
- Put a material page under exactly one broad, durable umbrella page in OS
  Library. Use the best existing Area umbrella first; create a new umbrella
  only when the source clearly does not fit one already there. Do not create
  umbrellas for source formats, individual creators, dates, or one-off topics.
- Before creating a page, check the relevant umbrella and OS Library for the
  canonical source URL/file and a materially matching title. Update the
  existing record when it is the same source; do not create a duplicate.
- Name material pages after the source's durable idea or original title, not
  "Grounded item," a date, or a generic format label.
- After each save, verify the parent chain is `OS Library → Area umbrella →
  material page` and leave the material's V.A.L.U.E. metadata and value card
  inside that page. Do the necessary filing as part of the invocation.
- Keep umbrellas broad and stable. If classification is genuinely ambiguous,
  choose the most useful retrieval Area rather than sending work back to the
  user or creating an Inbox for them to maintain.

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

### Durable web links

For a URL source, save the canonical URL as an actual rich-text hyperlink or
bookmark. Never paste a bare URL as plain text and assume the destination will
make it clickable.

- Put one prominent titled source link in the `Source URL/File` metadata above
  the value card, such as `Source: Watch Magnus Carlsen’s Evolution ↗` or
  `Source: Read the original article ↗`.
- Use a concise human label derived from the source title and medium. Do not
  turn the source line into a metadata dump. Creator, publication date,
  duration, caption language, and evidence pointers belong in the value
  content only when they materially help retrieval or support a claim.
- When one material record genuinely uses multiple web sources, give each one
  its own titled hyperlink. Do not leave raw URLs in a redundant `## Source`
  section.
- After saving, verify both the visible linked label and the rendered link's
  target/href. Seeing URL-shaped text is not verification that it is clickable.

### Link completion gate

Treat links as a checked deliverable, not presentation text. Before writing,
make an expected-source manifest with one stable ID per supplied primary or
supporting source and record its kind, human label, canonical target, and
expected destination identity.
For multiple sources, the saved record must be a bijection: every expected
source appears exactly once as its own prominent link, and no extra source-like
link is substituted for one of them.

After writing, re-read the complete material page and its child blocks from the
destination. Do not validate from the payload that was sent. The read-back must
prove all of the following:

- Every source has a concise human label and a non-null hyperlink target. The
  visible label must not be a URL, filesystem path, filename standing in for a
  link, or metadata sentence.
- Every saved href equals the intended canonical target. Resolve every external
  target and confirm the final identity; a redirect is acceptable only when it
  lands on the intended source. Record access controls or bot-blocked publisher
  responses explicitly rather than treating them as successful fetches.
- For an internal Notion page or block, retrieve the exact target ID, confirm
  the object kind, and confirm it is neither archived nor in trash.
- For an uploaded source, the metadata link targets the exact live file-block
  anchor, the file block has the required clean name, and the page contains one
  metadata link plus one file block—never a signed download URL, local path,
  duplicate caption, or raw-source dump.
- A whole-page scan finds no bare URLs, URL-shaped link labels, `/tmp`,
  `/private`, remote-attachment paths, signed URLs, redundant `Source` heading,
  duplicated primary-source entry, or generic evidence-pointer filler.

Normalize the expected manifest and the destination read-back into the JSON
shape consumed by `scripts/validate-link-record.mjs`, then run:

```sh
node scripts/validate-link-record.mjs <record.json>
```

`record.blocks` must include every block on the saved page. Each expected
source entry includes `id`, `kind`, `label`, `target`, `placement` (`metadata`
for a primary source or `supporting` for research), and a `verification` object
with `status: "resolved"` and `resolved_target`; source-link rich-text segments
carry the matching `source_id`. Give every represented source its own block.
Metadata links must appear above the Value card and supporting links after it.
File entries also include `block_id` and `file_name`; Notion entries include
`object_id` and resolved object metadata. Treat any validator error as
unfinished work: repair, re-read, and run it again. Never say `Grounded`,
`Saved`, `fixed`, `done`, or `closed` until every material record passes and
every target has been checked.

### Durable file attachments

For a user-supplied local file, an attachment path is only a temporary input
handle—not durable source evidence. When saving to an OS Library page that can
host files (such as Notion), upload the original file and attach it as a real,
clickable file block on the material page.

- Give the attachment a clean, human filename derived from the material title
  and retain its extension. Remove transport prefixes, sequence numbers,
  UUIDs, upload-directory names, and slug-like separators. For example,
  `1-why-bootstrap-wins.md` becomes `Why Bootstrap Wins.md`.
- Put a prominent, real, clickable source link in the `Source URL/File`
  metadata above the value card (for example, `Source: Open original Markdown
  file ↗`). It must target the attached file block or another stable source
  location—not an ephemeral or machine-local path such as `/tmp`, `/private`,
  a remote-attachment directory, or a workspace path.
- Use a clear action label rather than a bare filename when it improves
  scanability. A plain filename is not a source link. Do not use a temporary signed download URL as the durable link.
- Keep one visible `Original file` attachment block per material page. Its
  rendered filename must be the clean filename, not the upload transport name.
- Set the attachment's actual file-block `name` / filename display field to
  that clean filename. A caption, page title, or adjacent source-text link
  does not satisfy this requirement.
- Verify the rendered filename on the attachment control itself after saving
  (or read back the file block’s `name` field when visual inspection is not
  available), in addition to verifying the attachment and prominent clickable
  link.
- The attached original preserves the raw source. Do not add a raw-source dump,
  duplicate attachment caption, redundant `## Source` section, or generic
  evidence filler by default. Include extra source text only when it materially
  improves retrieval or the user asks for it.
- If the destination cannot accept an uploaded file, state that exact blocker
  and preserve the supplied raw text only when doing so is appropriate; do not
  masquerade a local path as a usable link.

## OS Library Record

When the OS Library is available, create one material page under its selected
Area umbrella with:

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

[Source URL/File metadata contains the visible clickable source link; the
original file attachment appears once below the value content.]
```

Preserve the raw source through its original attachment. Never replace it with
the distillation, fabricate a source, or imply validation beyond the available
evidence.

## Output Contract

After saving, respond with a five-line value card for each source:

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
