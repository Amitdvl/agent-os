# OpenCap recording workflows

Automatically use OpenCap for requested screen video capture, app/window recording, shareable recordings or recording event logs. Still screenshots and visual inspection use screenshot/Peekaboo. Check installed help before relying on these reviewed examples.

- Preflight version and `opencap record status` before starting; do not collide with an existing active session. Use `whoami` when auth/upload status matters and `config doctor` for macOS permissions/signing, with sanitized output only.
- Record only on request. Prefer the named app/window after `windows list`; otherwise use the requested/default display. Example: `record start --task DESCRIPTION --window ID` when supported. Check the actual visible target before capture.
- Start/stop/discard/open/share/delete/rename/trim/edit/cuts are user-visible or remote-state actions; exact recording target/action must be clear. When the requested capture is complete, supported `record stop` finalizes/uploads it; do not call that a purely local stop. Discard only when requested.
- Inspect existing recordings through bounded list/show/events reads. Log meaningful `session.marker` or `agent.action` milestones while recording an agent-driven workflow so later review can align actions and video.
- Screen Recording and optional account access stay human-controlled. Use doctor/whoami and report the precise missing access; do not inspect credential files, JWTs, share-management tokens or secret-bearing state. A no-active-recording error means there is nothing to stop, not permission to choose another recording.
