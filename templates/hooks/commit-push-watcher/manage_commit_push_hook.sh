#!/bin/zsh

set -euo pipefail

CODEX_HOME="${CODEX_HOME:-${HOME}/.codex}"
LABEL="${CODEX_COMMIT_PUSH_WATCHER_LABEL:-com.example.codex.commit-push-watcher}"
PLIST="${CODEX_COMMIT_PUSH_WATCHER_PLIST:-${HOME}/Library/LaunchAgents/${LABEL}.plist}"
DISABLED_PLIST="${PLIST}.disabled"
WATCHER="${CODEX_COMMIT_PUSH_WATCHER_SCRIPT:-${CODEX_HOME}/hooks/codex_commit_push_watcher.py}"
STATE="${CODEX_COMMIT_PUSH_WATCHER_STATE:-${CODEX_HOME}/tmp/commit_push_watcher_state.json}"
STDOUT_LOG="${CODEX_COMMIT_PUSH_WATCHER_STDOUT:-${CODEX_HOME}/log/commit-push-watcher.stdout.log}"
STDERR_LOG="${CODEX_COMMIT_PUSH_WATCHER_STDERR:-${CODEX_HOME}/log/commit-push-watcher.stderr.log}"
HOOK_LOG="${CODEX_COMMIT_PUSH_WATCHER_LOG:-${CODEX_HOME}/log/commit_push_watcher.log}"
UID_VALUE="$(id -u)"

bootout_if_loaded() {
  launchctl bootout "gui/${UID_VALUE}" "${PLIST}" >/dev/null 2>&1 || true
}

print_status() {
  echo "label=${LABEL}"
  if launchctl print "gui/${UID_VALUE}/${LABEL}" >/dev/null 2>&1; then
    echo "launchctl=loaded"
  else
    echo "launchctl=not-loaded"
  fi

  if [[ -f "${PLIST}" ]]; then
    echo "plist=enabled"
  elif [[ -f "${DISABLED_PLIST}" ]]; then
    echo "plist=disabled"
  else
    echo "plist=missing"
  fi

  if [[ -f "${WATCHER}" ]]; then
    echo "watcher=present"
  else
    echo "watcher=missing"
  fi
}

enable_hook() {
  if [[ ! -f "${WATCHER}" ]]; then
    echo "Watcher script missing: ${WATCHER}" >&2
    exit 1
  fi

  if [[ ! -f "${PLIST}" && -f "${DISABLED_PLIST}" ]]; then
    mv "${DISABLED_PLIST}" "${PLIST}"
  fi

  if [[ ! -f "${PLIST}" ]]; then
    echo "LaunchAgent plist missing: ${PLIST}" >&2
    exit 1
  fi

  bootout_if_loaded
  launchctl bootstrap "gui/${UID_VALUE}" "${PLIST}"
  echo "Hook enabled."
}

disable_hook() {
  bootout_if_loaded

  if [[ -f "${PLIST}" ]]; then
    mv "${PLIST}" "${DISABLED_PLIST}"
  fi

  rm -f "${STATE}" "${STDOUT_LOG}" "${STDERR_LOG}" "${HOOK_LOG}"
  echo "Hook disabled."
}

case "${1:-status}" in
  status)
    print_status
    ;;
  enable|install)
    enable_hook
    ;;
  disable|uninstall|remove)
    disable_hook
    ;;
  restart)
    enable_hook
    ;;
  *)
    echo "Usage: $0 [status|enable|disable|restart]" >&2
    exit 1
    ;;
esac
