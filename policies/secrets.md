# Secrets

- Never request credentials, API keys, login tokens, backup codes, cookies, or decrypted secret values in chat.
- Use a configured encrypted vault adapter when a task needs secrets. Keep only requirement names, scopes, and access classes in Agent OS.
- Never print decrypted values, credential files, browser session storage, cookie databases, keychain material, or secret-bearing tool configuration.
- Adding or first using an external service must update the user's own encrypted inventory through their configured vault workflow. Agent OS never creates or copies that inventory itself.
- Authentication remains a human checkpoint unless the selected tool has a separately authorized vault injection mechanism.

