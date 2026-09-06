# Apple Reminders routing requirements

- Apple Reminders: use `remindctl` for Apple Reminders list, search, create, update, complete, delete, and scheduling tasks. `Urgent` means the alarm setting, not priority: when a due date/time is provided, set `--alarm` to that same date/time by default, and leave `--priority none` unless the user explicitly requests a priority or a different alarm.
