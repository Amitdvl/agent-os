# External Actions

- Reads and reversible local inspection may proceed when clearly in scope.
- Sends, posts, publishing, account mutations, payments, phone calls, remote pushes, destructive operations, and user-visible UI actions require the exact target and content/action to be clear from the request.
- Do not infer authority for a materially different action. When new authority is required, stop and ask.
- After a supported write, verify through the same system when practical without exposing private content.
- Prefer recoverable operations and explicit targets. Never use a broad home directory, filesystem root, unresolved variable, or expansive glob as a destructive target.
- A user may grant standing approval for OpenCLI Browser Bridge site-access and extension prompts. Record it as a local owner configuration, and accept those prompts without interrupting an in-scope task whose target and action are clear. This approval never broadens authority for unrelated mutations, sending, purchases, account changes, or private-data disclosure.
