# Apple Reminders routing requirements

- Apple Reminders: use `remindctl` for Apple Reminders list, search, create, update, complete, delete, and scheduling tasks. `remindctl` cannot set Apple's native `Urgent` toggle; `--alarm` creates a separate EventKit notification. For timed reminders, set `--alarm` to the due time by default and leave `--priority none` unless explicitly requested. Do not claim native Urgent is enabled.
