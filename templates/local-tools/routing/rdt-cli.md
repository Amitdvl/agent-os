# Reddit routing requirements

- Reddit: use `rdt` for Reddit browsing, subreddit/post/user lookup, post/comment reading, search, exports, feed review, saved/upvoted review, account status, and explicit Reddit interactions. Prefer `--json` or `--yaml`, use `--compact` for listing commands, and keep requests bounded and sequential. For writes such as upvotes, downvotes, saves, comments, subscribes, unsubscribes, or undo actions, act only when the user's request includes the exact target and content/action. Do not expose Reddit cookies, browser cookie stores, or `rdt-cli` credential files.
