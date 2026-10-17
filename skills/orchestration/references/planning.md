# Planning a bounded change

Use a plan when it reduces uncertainty, coordination cost or recovery risk. Size it
to the task; a short checklist can be enough. Keep local work moving without a
separate approval phase when scope and authority are clear.

1. State the observable outcome and non-goals. Name unresolved assumptions.
2. Read the relevant interfaces, project instructions and existing tests before
   choosing an approach. Include exact file targets only after inspecting them.
3. Split work into coherent changes with an acceptance check for each. Specify
   behavior, errors and side effects rather than prescribing every line of code.
4. Choose testing ownership before suite expansion. Plan isolation for concurrent
   writers and recovery for consequential changes.
5. Execute, check evidence, and revise when reality differs. A plan is a working
   hypothesis; it never supersedes the user's scope or grants new authority.

A useful handoff records current source state, completed checks, remaining risks,
and the next concrete action. Avoid copying private project findings into global
references. No mandatory planning document, worktree or external agent framework.

Adapted from Superpowers planning guidance; see [license](superpowers-LICENSE.txt).
