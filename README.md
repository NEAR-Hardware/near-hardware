<p align="center">
  <img src="images/logo.png" alt="NEAR Hardware logo" width="160" />
</p>

<h1 align="center">NEAR Hardware</h1>

<p align="center">
  A DePIN &amp; IoT suite for NEAR Protocol: device firmware, a desktop app, and skills + MCP so any agent can set up NEAR hardware.
</p>

## What it is

NEAR Hardware connects physical devices (ESP32 boards, watches, Raspberry Pis) to NEAR. The goal: devices hold their own keys, sign NEAR transactions and Intents within on-chain spending limits, and coding agents like Claude Code and Codex customize device firmware through bundled skills and an MCP server.

**Status:** early development. What works today in the desktop app:

- **Environments:** detects Claude Code, Codex, Cursor and OpenCode on your machine (with versions) and lets you connect any of them.
- **Projects:** create a project folder (or open an existing one); its files show in a live-updating tree with VS Code-style file icons.
- **Chats:** start a chat in a project with one of your connected agents. The chat drives that agent's own CLI in the background: **Claude Code** (via the Claude Agent SDK) and **Codex** (via `codex app-server`) work today, with streaming replies, tool calls, approve/deny prompts, image paste, slash commands, model and permission-mode pickers, context usage and plan limits. Chats resume where they left off after a restart. OpenCode and Cursor chats are next.

The contract, firmware, MCP server and skills are in progress.

## Repository layout

```
apps/desktop/   Electron + React + TypeScript desktop app
images/         Logo and artwork
```

More packages (contract, firmware, MCP server, skills) land as they're built.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev        # start the desktop app with hot reload
bun run build      # typecheck and production build
```

To try the "agent not installed" flow on a machine that has every agent, hide some in dev:

```sh
NEAR_HARDWARE_HIDE_AGENTS=codex,cursor bun run dev
```

## Credits

- File tree icons: [file-icons](https://github.com/file-icons/vscode) (MIT), regenerated with `apps/desktop/scripts/build-file-icons.mjs`.
- Agent logos: [simple-icons](https://simpleicons.org) (CC0) and [lobehub icons](https://github.com/lobehub/lobe-icons) (MIT). Product names and logos belong to their owners.
