---
name: add
description: Add a new external tool or service to Agent OS manifests and portable guidance without silently installing or authenticating it.
---

# Add

Use `/add <tool-or-url>` to integrate a capability into the Agent OS source repository.

1. Inspect authoritative upstream documentation, installed help when available, versioning, license, binary names, authentication, data roots, read/write surfaces, and destructive operations.
2. Add or update the tool, source, pack, secret-requirement, and generated-skill metadata.
3. Keep credentials, account IDs, sessions, archives, and absolute personal paths out of the repository.
4. Do not install packages, grant OAuth, add browser extensions, or authenticate unless the user separately requests deployment.
5. Validate manifests and tests, then document the future human setup checkpoint.

Stop when upstream identity/license is unresolved, safe authentication cannot be separated, or the requested integration would weaken the focus policy.

