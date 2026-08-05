# Block No Verify Template

This PreToolUse hook blocks `git commit` and `git push` commands that include `--no-verify`.

Configure `BLOCK_NO_VERIFY_MESSAGE` to name the repository's actual verification command. Keep project-specific commands out of the reusable template.
