# `$book`

`$book <subject>` commissions Codex to research, conceive, write, revise, fact-check, and publish one coherent 10,000–30,000-word nonfiction book. It presents one compact editorial brief, waits for explicit approval, then works autonomously until a validated EPUB exists in `~/Desktop/books/`.

## Runtime requirements

- macOS with Python 3.11 or newer
- External research access
- Pandoc and EPUBCheck
- Java when EPUBCheck is configured as a JAR rather than an executable

Install the standard Homebrew dependencies:

```bash
brew install pandoc epubcheck
pandoc --version
epubcheck --version
```

Run the deterministic preflight directly when troubleshooting:

```bash
python3 scripts/preflight.py --destination "$HOME/Desktop/books" --json
```

## Permissions

The skill does not need `danger-full-access` merely to produce a book. The recommended Codex posture is `workspace-write`, outbound network access for research, normal temporary-directory access, and one narrow additional writable root for the final destination:

```toml
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
writable_roots = ["/Users/<actual-user>/Desktop/books"]
```

Use the absolute expanded destination path. Do not edit global security configuration merely to run the skill; the normal one-time filesystem approval at delivery is also acceptable.

## Run lifecycle

Working research, evidence packets, chapters, QA records, and build files live in a unique `$TMPDIR/codex-book-*` workspace. A successful run verifies the delivered EPUB and removes only that workspace, leaving one new durable artifact. An unrecoverable failure records a concise error and preserves the workspace for recovery.

Existing EPUBs are never overwritten. A collision becomes `title-2.epub`, then `title-3.epub`, and so on.

## Troubleshooting

- **Pandoc or EPUBCheck missing:** install both with the Homebrew command above, then rerun preflight.
- **Destination not writable:** grant the normal write approval or add only the absolute `~/Desktop/books` path as a writable root.
- **No external research path:** restore network or research-tool access; the skill will not write nonfiction from memory alone.
- **EPUBCheck errors:** keep the failed workspace, inspect `build/epubcheck.txt`, repair the manuscript/package, and rebuild. Never deliver the rejected candidate.
- **Skill does not appear:** confirm `~/.agents/skills/book/SKILL.md` resolves, then restart Codex if automatic detection has not refreshed.
