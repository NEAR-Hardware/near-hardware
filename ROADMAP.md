# NEAR Hardware: roadmap and progress

Working list for the desktop app, kept up to date as goals land. Each goal is only checked off once it has been **tested in the running app**, not just written. Status notes say what was verified and how.

Legend: `[x]` done and tested · `[~]` in progress / partially done · `[ ]` not started

## 1. Chat parity with each agent

- [x] **Claude Code chat** through the Claude Agent SDK, running the user's installed `claude` CLI. Verified live: streaming, tool calls, Allow/Always/Deny prompts, images, slash commands (`/` menu with 71 commands), model + permission-mode pickers, context meter, cost, 5-hour limit, Stop, queued messages, resume after app restart.
- [x] **Codex chat** through `codex app-server`. Verified live: 8 models, approvals for a file edit and a command, file written to disk, context meter, 5-hour + weekly limits, `/status`.
- [~] **Cursor chat** through ACP (`agent acp`). Adapter written and wired; not testable yet because Cursor's agent CLI isn't installed on PATH or signed in on this Mac.
- [x] **OpenCode chat** through the ACP adapter (`opencode acp`). Verified live: replied in the app chat. Later: a richer adapter on `opencode serve` (HTTP + SSE) would add token and cost detail.
- [x] **Everything the agent supports works in the chat**: the agent runs its own CLI with the user's settings, MCP servers and skills. Verified live during board onboarding: Claude Code's WebSearch, WebFetch, Bash and git all ran inside the app chat.
- [x] **Agent names the chat itself** with the `set_chat_title` MCP tool. Verified live: Claude Code named its chat "USB device check", Codex "Check connected USB devices".
- [x] **`hardware-agent.md` system prompt** (`apps/desktop/resources/hardware-agent.md`): harness, chat naming, tools, the 5 board onboarding stages. Delivered as Claude's appended system prompt, Codex developer instructions, and a first-prompt preamble for ACP agents. Verified for Claude Code and Codex.
- [x] **Edits show green/red**: edits as red/green line diffs, Codex unified diffs colored, new files from `Write` all green (verified: `BOARD.md` rendered as 54 green lines).

- [x] **YOLO mode** in every agent's mode picker: approves every request without asking (Claude Code `bypassPermissions`, Codex full access with `approvalPolicy: never`, and the app answers every Cursor/OpenCode permission request). Native warning before turning it on (with "Don't ask again"), the picker turns red while it's on, and requests already waiting are approved on switch. Verified live: Claude Code ran Bash + WebFetch and Codex ran `curl` to the internet with zero prompts; Cancel leaves the mode unchanged.

## 2. Hardware integration

- [x] **Install PlatformIO** from Environments → Hardware toolchain (runs PlatformIO's official installer, streams its log). Verified: PlatformIO 6.2.0 installed in 18 s into `~/.platformio/penv`; `pio` is on the PATH of every agent and the terminal.
- [x] **Detect plugged-in devices**: USB serial watcher (every 2 s) with vendor/product ids, serial number and chip-maker hints; toast on plug-in; shown in the board setup card and serial monitor. Verified with the user's ESP32-S3 watch: `/dev/cu.usbmodem101`, Espressif 303a:1001. (Toast not physically re-tested: needs a re-plug.)
- [x] **Mandatory board name**: every new chat opens with the board setup card instead of the composer, asking for the exact product name from the manufacturer's site (warns on vague names like "ESP32"). If the project already has a board it's pre-filled with "Continue with this board"; typing a different name starts a fresh board profile and onboarding. Verified live: empty field + warning on a project without a board, pre-filled + Continue → composer on the watch project, replace hint for a different name. Earlier behaviour (first chat only): the card replaces the composer until the exact name is entered; picks the connected device; saves the board profile and kicks off onboarding. Verified the gate renders with the watch auto-selected. Original goal: in a hardware chat, the first required field asks for the exact board/device name, advising the user to copy the full name from the manufacturer's site (e.g. "ESP32-S3 2.06inch AMOLED Touch Watch Development Board").
- [x] **Start without a board**: projects without a board offer "Continue without a board" on the board card, so the user can talk through ideas, parts and wiring first and add the board later. Verified on the demo project.
- [x] **Board onboarding stages**, verified end to end on the user's watch in `~/Documents/NEAR Hardware/esp32-watch` (Claude Code, Sonnet 5.5): it identified the board on `cu.usbmodem101`, found the official Waveshare wiki and cloned the official examples, wrote `BOARD.md` (pin table, peripherals, sources), wrote `platformio.ini` + a CO5300 AMOLED hello-world that builds, flashed it, and read "alive" over serial. It also caught that the board has 32 MB flash (docs imply 16 MB) and is waiting for the user to hold BOOT for a corrected reflash. Stages as defined in `hardware-agent.md`:
  1. Identify: board name from the user + the connected port and USB ids.
  2. Research: find the manufacturer and official wiki/docs (e.g. https://docs.waveshare.com/ESP32-S3-Touch-AMOLED-2.06), read them, download official examples.
  3. Understand: write a `BOARD.md` summary (MCU, flash/PSRAM, pins, display, sensors, quirks, links).
  4. Screen (added after the watch run): right away, record the display (size, shape, corner radius) with `save_board_profile` and design a starter `screens/home.html`, so the app's screen preview shows it; `screen: null` for boards without a display.
  5. PlatformIO: translate that into `platformio.ini` (board, framework, build flags, libraries) and build a first example that draws the home screen design on the display.
  6. Flash and verify: upload, confirm on the serial monitor, and ask the user whether the display shows the home screen.
- [x] **Hardware tools for agents**: `near-hardware` MCP server (`resources/near-hardware-mcp.mjs`, bridged to the app over a token-protected localhost server) with `set_chat_title`, `list_devices`, `get_board`, `save_board_profile`, `serial_read`, `serial_write`, `serial_close`. Loaded by Claude Code (stdio, pre-approved), Codex (`-c mcp_servers`, elicitations auto-approved) and ACP agents. `list_devices`, `get_board` and `serial_read` verified live with the watch during onboarding. PlatformIO itself is used through the agent's shell.
- [x] **Bottom panel like VS Code** (⌘J or the title-bar button): Terminal (xterm + node-pty, project folder, `pio` on PATH) and Serial Monitor. Verified: panel opens, terminal runs commands in the project, serial connects to the watch at 115200 and disconnects cleanly. Original goal: integrated terminal and serial monitor (port + baud rate picker, line endings, send box, clear, autoscroll), resizable and collapsible. Collapsed, it leaves a bar at the bottom with Terminal and Serial Monitor (green dot while a port is open); clicking either reopens the panel on that tab. The panel spans under the files panel to the window's right edge, and the terminal falls back to installed Nerd Fonts so Powerlevel10k/Starship prompt icons render (verified with JetBrainsMono Nerd Font).

- [x] **Board status pill** in the chat header, before the agent pill: grey "Board not detected" until the project has a board, green with the board name while it's plugged in, red when it's known but unplugged. Matches by USB serial number (saved at board setup), else port, else vendor/product id. Verified live: green with the watch plugged in, red after it was unplugged, grey on a project without a board.

## 3. Editor

- [x] **Files open as tabs in the center, like VS Code**: Monaco editor (VS Code's editor) with a theme matching the app; tabs in the title bar next to the chat tab. Single click previews (italic tab, replaced by the next preview), double click or editing keeps it; dirty dot; ⌘S save and ⌘W close tab from a new File menu (⌘⇧W closes the window); native "Save changes?" prompt; ⌃Tab cycles; tab menu (Close Others/to the Right/All, Copy Path, Reveal, Open in Default App); tabs persist per project; the chat stays mounted behind file tabs. Live reload when an agent edits an open file (keeps cursor and undo); a conflict bar when the file changes on disk while you have unsaved edits. Images open in a viewer; Markdown has a preview toggle; binary and very large files offer the default app. Verified live: preview replace, C++/ini highlighting, Markdown preview, live reload, typing → dirty, File → Save writes to disk, conflict bar, Cancel/Don't Save prompt, image viewer, ⌃Tab, tabs restored after restart. Not yet: production-build check that Monaco's workers load from the packaged app.

## 4. Screen preview (experimental)

- [x] **Board screen preview** (v1, experimental): the board's display drawn in a black plastic device shell (rect, rounded or round, with the panel's corner radius), docked under the files with a resizable split, and a pop-out into a frameless, always-on-top, resizable window that is just the device (like the iOS Simulator). Agents record the display with `save_board_profile` → `screen` and mock up UIs as `screens/*.html` at panel resolution (rules in `hardware-agent.md`); the preview updates live as they edit. Presets for common panels (2.06″ 410×502 AMOLED, 1.28″ round, 1.69″, 2.8″ TFT, 0.96″ OLED, …), rotate, and "no screen".
  - Verified live on the watch: Claude Code read Waveshare's official dimension drawing (active area 33.09 × 40.51 mm, R9.2 mm corners), saved `410×502, rounded, cornerRadius 114, 2.06″ AMOLED, CO5300`, and wrote `screens/home.html` (watch face) and `screens/activity.html`; both render in the docked pane and the floating window, with ‹ › to switch designs and Esc/× to dock.
  - Experiments to try next: mirror the real display (firmware streams framebuffer snapshots over serial), run LVGL in the browser (WebAssembly) so the preview is the real UI code, touch input on the preview.

## 5. Pins and wiring (experimental)

- [~] **Chat | Wiring switch** in the chat header: flips the middle of the chat between the conversation and a live pin + wiring whiteboard (drag the board and parts, wires follow and part pins turn to face what they're wired to; drag the background or two-finger scroll to pan, pinch or ⌘ + scroll to zoom, Fit and Reset layout; positions saved per project). Verified with simulated mouse input: board drag, a part dragged across the board flips its pins, pinch zoom 41% → 61%, pan, fit, reset. The diagram is drawn from the project's `wiring.json` (the composer stays, so the user can ask for a change and watch it redraw). The board is drawn as a PCB with its header pins on both edges (power red, ground grey, buses blue, pins the board already uses dimmed), parts in columns beside it (parts wired only to other parts, like a lamp behind a relay, one column further out), colour-coded curved wires (dashed orange for mains), hover to trace a wire or a pin, a connection table and safety notes underneath, and a button to open `wiring.json` in an editor tab. Agents write the board's pins during onboarding (stage 3) and add parts and wires whenever the user plans a connection, including resistors, drivers and relays (rules and schema in `hardware-agent.md`).

## Next

- Cursor chat: install and sign in to Cursor's agent CLI (`agent login`), then test the ACP adapter live.
- OpenCode: richer adapter on `opencode serve` for token, cost and context.
- Re-plug test for the device toast; reflash the watch after holding BOOT (the esp32-watch chat is waiting).
- Packaging: build a signed release and confirm the MCP server and native modules (serialport, node-pty) load from the app bundle.

## Notes

- Agent research briefs (protocols verified against the installed CLIs) live outside the repo; key facts are captured in the adapters' comments.
- Deadline: NEAR hackathon submission, 14 Nov 2026 23:59 UTC.
