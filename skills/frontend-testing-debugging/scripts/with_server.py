#!/usr/bin/env python3
"""Run a command with owned local servers; retain multi-server helper CLI.
Modified by Agent OS: reject occupied ports and clean up entire process groups.
"""
import argparse
import os
import signal
import socket
import subprocess
import sys
import time


def listening(port):
    try:
        with socket.create_connection(('localhost', port), timeout=0.2):
            return True
    except OSError:
        return False


def signal_owned_group(process, signum):
    try:
        os.killpg(process.pid, signum)
    except ProcessLookupError:
        return
    except PermissionError as error:
        # A rapidly disappearing shell/child group can briefly report EPERM
        # after its leader is reaped. Never treat permission denial alone as
        # successful cleanup or retry a real signal against a reused group ID.
        if process.poll() is None:
            raise
        deadline = time.monotonic() + 0.25
        while time.monotonic() < deadline:
            try:
                os.killpg(process.pid, 0)
            except ProcessLookupError:
                return  # Confirmed gone, rather than merely inaccessible.
            except PermissionError:
                time.sleep(0.005)
                continue
            raise error  # A present group must not be silently retained.
        raise error


def stop_owned(processes):
    if os.name == 'posix':
        # Send to groups even if the shell leader exited; its children may remain.
        for process in reversed(processes):
            signal_owned_group(process, signal.SIGTERM)
        deadline = time.monotonic() + 2
        for process in reversed(processes):
            try:
                process.wait(timeout=max(0.01, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                pass
        for process in reversed(processes):
            signal_owned_group(process, signal.SIGKILL)
            process.wait()
    else:
        for process in reversed(processes):
            subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            process.wait()


def main():
    parser = argparse.ArgumentParser(description='Run command with one or more owned servers')
    parser.add_argument('--server', action='append', dest='servers', required=True)
    parser.add_argument('--port', action='append', dest='ports', required=True, type=int)
    parser.add_argument('--timeout', type=float, default=30, help='Seconds per server')
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if len(args.servers) != len(args.ports) or not command:
        parser.error('Server/port counts must match and a command is required')
    if len(set(args.ports)) != len(args.ports) or any(not 0 < p < 65536 for p in args.ports) or args.timeout <= 0:
        parser.error('Ports must be unique and valid; timeout must be positive')
    if any(listening(port) for port in args.ports):
        parser.error('A requested port is already occupied; reuse it without this helper')
    processes = []
    previous = {}
    def interrupted(signum, _frame):
        raise SystemExit(128 + signum)
    try:
        for signum in (signal.SIGTERM, signal.SIGINT):
            previous[signum] = signal.signal(signum, interrupted)
        for cmd, port in zip(args.servers, args.ports):
            print(f'Starting owned server on port {port}', flush=True)
            # Inherit streams instead of filling an unread PIPE on noisy servers.
            process = subprocess.Popen(cmd, shell=True, start_new_session=(os.name == 'posix'))
            processes.append(process)
            deadline = time.monotonic() + args.timeout
            while not listening(port):
                if process.poll() is not None:
                    raise RuntimeError(f'Server exited before port {port} became ready')
                if time.monotonic() >= deadline:
                    raise RuntimeError(f'Server did not start on port {port} within {args.timeout}s')
                time.sleep(0.05)
        child = subprocess.Popen(command, start_new_session=(os.name == 'posix'))
        processes.append(child)
        code = child.wait()
        return code if code >= 0 else 128 - code
    except (OSError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    finally:
        # Avoid an interrupt interrupting cleanup and leaving descendants behind.
        for signum in previous:
            signal.signal(signum, signal.SIG_IGN)
        stop_owned(processes)
        for signum, handler in previous.items():
            signal.signal(signum, handler)


if __name__ == '__main__':
    sys.exit(main())
