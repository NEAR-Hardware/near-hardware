# NEAR Hardware: roadmap and progress

Working list for the desktop app, kept up to date as goals land. Each goal is only checked off once it has been **tested in the running app**, not just written. Status notes say what was verified and how.

Legend: `[x]` done and tested · `[~]` in progress / partially done · `[ ]` not started

## 1. Chat parity with each agent

- [x] **Claude Code chat** through the Claude Agent SDK, running the user's installed `claude` CLI. Verified live: streaming, tool calls, Allow/Always/Deny prompts, images, slash commands (`/` menu with 71 commands), model + permission-mode pickers, context meter, cost, 5-hour limit, Stop, queued messages, resume after app restart.
- [x] **Codex chat** through `codex app-server`. Verified live: 8 models, approvals for a file edit and a command, file written to disk, context meter, 5-hour + weekly limits, `/status`.
- [~] **Cursor chat** through ACP (`agent acp`). Adapter written and wired; not testable yet because Cursor's agent CLI isn't installed on PATH or signed in on this Mac.
- [~] **OpenCode chat** wired through the same ACP adapter (`opencode acp`). Not live-tested yet. Research recommends a richer adapter on `opencode serve` (HTTP + SSE) later for token and cost detail.
- [ ] **Everything the agent supports works in the chat**, e.g. Claude Code's web search / web fetch / browser (MCP) tools. Test web search end to end.
- [x] **Agent names the chat itself** with the `set_chat_title` MCP tool. Verified live: Claude Code named its chat "USB device check", Codex "Check connected USB devices".
- [x] **`hardware-agent.md` system prompt** (`apps/desktop/resources/hardware-agent.md`): harness, chat naming, tools, the 5 board onboarding stages. Delivered as Claude's appended system prompt, Codex developer instructions, and a first-prompt preamble for ACP agents. Verified for Claude Code and Codex.
- [~] **Edits show green/red**: Claude edits (old → new) and Codex unified diffs render as colored diffs. Still to do: new files from `Write` should show all-green.

## 2. Hardware integration

- [x] **Install PlatformIO** from Environments → Hardware toolchain (runs PlatformIO's official installer, streams its log). Verified: PlatformIO 6.2.0 installed in 18 s into `~/.platformio/penv`; `pio` is on the PATH of every agent and the terminal.
- [x] **Detect plugged-in devices**: USB serial watcher (every 2 s) with vendor/product ids, serial number and chip-maker hints; toast on plug-in; shown in the board setup card and serial monitor. Verified with the user's ESP32-S3 watch: `/dev/cu.usbmodem101`, Espressif 303a:1001. (Toast not physically re-tested: needs a re-plug.)
- [x] **Mandatory board name**: board setup card replaces the composer until the exact name is entered; picks the connected device; saves the board profile and kicks off onboarding. Verified the gate renders with the watch auto-selected. Original goal: in a hardware chat, the first required field asks for the exact board/device name, advising the user to copy the full name from the manufacturer's site (e.g. "ESP32-S3 2.06inch AMOLED Touch Watch Development Board").
- [ ] **Board onboarding stages** the agent follows for consistent results (defined in `hardware-agent.md`):
  1. Identify: board name from the user + the connected port and USB ids.
  2. Research: find the manufacturer and official wiki/docs (e.g. https://docs.waveshare.com/ESP32-S3-Touch-AMOLED-2.06), read them, download official examples.
  3. Understand: write a `BOARD.md` summary (MCU, flash/PSRAM, pins, display, sensors, quirks, links).
  4. PlatformIO: translate that into `platformio.ini` (board, framework, build flags, libraries) and build a first example.
  5. Flash and verify: upload, then confirm on the serial monitor.
- [~] **Hardware tools for agents**: `near-hardware` MCP server (`resources/near-hardware-mcp.mjs`, bridged to the app over a token-protected localhost server) with `set_chat_title`, `list_devices`, `get_board`, `save_board_profile`, `serial_read`, `serial_write`, `serial_close`. Loaded by Claude Code (stdio, pre-approved), Codex (`-c mcp_servers`, elicitations auto-approved) and ACP agents. `list_devices` verified live with no board plugged in; serial tools still need a real board. PlatformIO itself is used through the agent's shell.
- [x] **Bottom panel like VS Code** (⌘J or the title-bar button): Terminal (xterm + node-pty, project folder, `pio` on PATH) and Serial Monitor. Verified: panel opens, terminal runs commands in the project, serial connects to the watch at 115200 and disconnects cleanly. Original goal: integrated terminal and serial monitor (port + baud rate picker, line endings, send box, clear, autoscroll), resizable and collapsible.

## Notes

- Agent research briefs (protocols verified against the installed CLIs) live outside the repo; key facts are captured in the adapters' comments.
- Deadline: NEAR hackathon submission, 14 Nov 2026 23:59 UTC.
