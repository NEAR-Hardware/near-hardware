# NEAR Hardware: roadmap and progress

Working list for the desktop app, kept up to date as goals land. Each goal is only checked off once it has been **tested in the running app**, not just written. Status notes say what was verified and how.

Legend: `[x]` done and tested · `[~]` in progress / partially done · `[ ]` not started

## 1. Chat parity with each agent

- [x] **Claude Code chat** through the Claude Agent SDK, running the user's installed `claude` CLI. Verified live: streaming, tool calls, Allow/Always/Deny prompts, images, slash commands (`/` menu with 71 commands), model + permission-mode pickers, context meter, cost, 5-hour limit, Stop, queued messages, resume after app restart.
- [x] **Codex chat** through `codex app-server`. Verified live: 8 models, approvals for a file edit and a command, file written to disk, context meter, 5-hour + weekly limits, `/status`.
- [~] **Cursor chat** through ACP (`agent acp`). Adapter written and wired; not testable yet because Cursor's agent CLI isn't installed on PATH or signed in on this Mac.
- [ ] **OpenCode chat**. Waiting on protocol research (ACP vs `opencode serve`).
- [ ] **Everything the agent supports works in the chat**, e.g. Claude Code's web search / web fetch / browser (MCP) tools. Test web search end to end.
- [ ] **Agent names the chat itself**: give agents a tool (`set_chat_title`) through the NEAR Hardware MCP server, and instruct them to use it.
- [ ] **`hardware-agent.md` system prompt**: tells every agent it runs inside the NEAR Hardware harness, how to name the chat, the hardware workflow stages and the tools it has. Delivered as Claude's appended system prompt, Codex developer instructions, and a first-turn preamble for ACP agents.
- [~] **Edits show green/red**: Claude edits (old → new) and Codex unified diffs render as colored diffs. Still to do: new files from `Write` should show all-green.

## 2. Hardware integration

- [ ] **Install PlatformIO** from the app (managed install into the app's data folder, no manual setup).
- [ ] **Detect plugged-in devices**: watch USB serial ports (vendor/product ids, manufacturer, serial number) and surface new devices in the UI and the chat.
- [ ] **Mandatory board name**: in a hardware chat, the first required field asks for the exact board/device name, advising the user to copy the full name from the manufacturer's site (e.g. "ESP32-S3 2.06inch AMOLED Touch Watch Development Board").
- [ ] **Board onboarding stages** the agent follows for consistent results (defined in `hardware-agent.md`):
  1. Identify: board name from the user + the connected port and USB ids.
  2. Research: find the manufacturer and official wiki/docs (e.g. https://docs.waveshare.com/ESP32-S3-Touch-AMOLED-2.06), read them, download official examples.
  3. Understand: write a `BOARD.md` summary (MCU, flash/PSRAM, pins, display, sensors, quirks, links).
  4. PlatformIO: translate that into `platformio.ini` (board, framework, build flags, libraries) and build a first example.
  5. Flash and verify: upload, then confirm on the serial monitor.
- [ ] **Hardware tools for agents** (NEAR Hardware MCP server): list devices with USB ids, identify the chip, read/write serial with a baud rate, run PlatformIO build/upload/monitor, record the board profile.
- [ ] **Bottom panel like VS Code**: integrated terminal and serial monitor (port + baud rate picker, line endings, send box, clear, autoscroll), resizable and collapsible.

## Notes

- Agent research briefs (protocols verified against the installed CLIs) live outside the repo; key facts are captured in the adapters' comments.
- Deadline: NEAR hackathon submission, 14 Nov 2026 23:59 UTC.
