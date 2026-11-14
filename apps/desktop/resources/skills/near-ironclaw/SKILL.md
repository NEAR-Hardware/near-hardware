---
name: near-ironclaw
description: Run an IronClaw agent (NEAR AI's open-source Rust agent runtime) for a NEAR Hardware project - hosted in a TEE on NEAR AI Cloud or installed locally, how it keeps credentials away from the model, feeding it board readings over its Responses API or webhooks, and letting it act on NEAR through a limited sub-account.
---

# IronClaw: an always-on agent for a device

IronClaw is NEAR AI's open-source (MIT or Apache-2.0) agent runtime, written in Rust and shipped as one binary, `ironclaw`. It gives an agent a web chat, a terminal REPL, Slack and Telegram channels, scheduled and webhook-triggered **routines**, parallel jobs, persistent memory, skills (`SKILL.md`), sandboxed WASM tools and HTTP MCP servers, on 25+ model providers (NEAR AI Cloud by default). Latest release on 2026-11-14: `ironclaw-v1.4.1`.

You (Claude Code, Codex…) build the project inside NEAR Hardware. IronClaw is the agent that **keeps running afterwards**: it watches a board's readings, sends alerts, runs on a schedule and acts within limits you set. For NEAR AI Cloud's inference API itself, read `near-ai`.

## Hosted or local

|                | Agent Hub (hosted)                                          | Local or own server                              |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Where it runs  | A private instance in a **TEE on NEAR AI Cloud**             | The Mac, a Linux box, a VPS (DigitalOcean, GCE, EC2 guides) |
| Set up by      | The user at https://agent.near.ai: sign in, create an IronClaw agent, add an SSH public key | Installer + `ironclaw onboard` |
| Reach it at    | `https://<instance-id>.agents.near.ai` (web chat), SSH       | `http://127.0.0.1:3000` (local only by default)   |
| Start/stop     | Agent Dashboard; updates are automatic; `ironclaw service` does not work there | `ironclaw service install/start/stop/status` |

Hosted plans on https://ironclaw.com (2026-11-14; they may change, and the user signs up, not you): **Starter $0/month**, 1 agent instance in a TEE using NEAR AI inference, $5 credits included; **Basic $20/month**, up to 2 instances, $20 credits; **Pro+ $200/month**, up to 5 instances, $200 credits.

Pick hosted when a board must reach the agent over the internet or the user wants the TEE; local for development or private-network setups.

## Install and run locally

Installing writes a binary and a home folder; get the user's OK first.

```sh
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/nearai/ironclaw/releases/latest/download/ironclaw-installer.sh | sh
ironclaw --version
```

**Onboarding asks for an API key, so the user runs it in their own terminal**: `ironclaw onboard`. It creates the home (`~/.ironclaw/reborn` by default; `ironclaw config path` shows it), `config.toml`, `providers.json`, a master key in the macOS Keychain, the web login token, and offers to install a background service. It prints `login_link: http://127.0.0.1:3000/login?token=…`; that token is for the user's browser, don't copy it into chat.

Without a terminal session: `ironclaw onboard --no-service < /dev/null`, then the provider below.

```sh
ironclaw serve            # web UI + API on 127.0.0.1:3000 (--port 3100 if taken)
ironclaw run -m "What's the greenhouse temperature trend today?"   # one shot
ironclaw repl             # interactive
ironclaw doctor           # first thing to run when something fails
ironclaw service install && ironclaw service start   # keep it running (stop the foreground serve first)
```

### Use NEAR AI Cloud for inference

```toml
# config.toml
[llm.default]
provider_id = "nearai"
model       = "z-ai/glm-5.3-flash"     # a current id from https://cloud-api.near.ai/v1/models
api_key_env = "NEARAI_API_KEY"
```

Or `ironclaw models set-provider nearai --model z-ai/glm-5.3-flash`, then `ironclaw models status`. `api_key_env` holds the variable **name**; a pasted key is rejected when the file loads. The user stores the key with `ironclaw config set nearai.api_key` (prompts with hidden input) or in the web UI's Settings → Inference. After `config set`, restart: `ironclaw service restart` locally, the Agent Dashboard when hosted.

## How it keeps credentials away from the model

- Secrets are encrypted at rest under a master key in the OS keychain (`IRONCLAW_REBORN_SECRET_MASTER_KEY` on a headless host). `config.toml` only names environment variables.
- **Tools never see secrets.** A tool declares the credential it needs and the hosts it is for; the network proxy injects it into outgoing requests to those hosts only.
- Tools run in WASM sandboxes with **allowlisted** hosts and paths; a leak detector scans what goes to the model and what leaves the machine for key-like strings.
- The `shell` tool exists only with `ALLOW_LOCAL_TOOLS=true`. It scrubs `*_KEY`, `*_SECRET`, `*_TOKEN`, `*_PASSWORD` and the provider keys from the command's environment and blocks `;`, `&&`, `||` and `$()`.
- On the Agent Hub the whole instance runs inside a TEE on NEAR AI Cloud.

So the user enters keys and OAuth logins in IronClaw itself (onboarding, `config set`, **Extensions** in the web UI). You never handle them.

## Feed it a board's data

Keep the agent's address and token in the project's git-ignored `.env.local` (`IRONCLAW_URL`, `IRONCLAW_TOKEN`), written by the user, loaded with `set -a; . ./.env.local; set +a` inside the command. Never print them.

**Responses API**: OpenAI-compatible, through the full agent loop (tools, memory, routines):

```sh
curl -s -X POST "$IRONCLAW_URL/api/v1/responses" \
  -H "Authorization: Bearer $IRONCLAW_TOKEN" -H "Content-Type: application/json" \
  -d '{"model": "default", "input": "Greenhouse: 31.4 C, soil moisture 12%. Water now? Answer yes or no and why."}' \
  | jq -r '.output[] | select(.type == "message") | .content[0].text'
```

Pass `previous_response_id` to continue a conversation. The OpenAI SDKs work with `baseURL: "$IRONCLAW_URL/api/v1"`. Limit: 30 requests per minute per user. The instance token (`webui-token`) has **operator** rights; for anything beyond the user's own scripts, use a per-user token (multi-user deployments, see `api/responses.md`). `/v1/chat/completions` on IronClaw is a plain model proxy without tools or memory.

**Webhook routine**: the narrow way for a board or relay to wake the agent. Ask the agent in chat to create a reactive routine (it calls `routine_create`; there's no UI for webhook routines yet), e.g. with trigger `{"type": "webhook", "path": "/hooks/greenhouse", "secret": "${GREENHOUSE_WEBHOOK_SECRET}"}`. Then:

```sh
curl -X POST "$IRONCLAW_URL/hooks/greenhouse" -H "Authorization: Bearer $GREENHOUSE_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" -d '{"temp_c": 31.4, "soil": 12, "board": "greenhouse-1"}'
```

The body reaches the routine's prompt. The secret only fires that routine, so it is the one credential a relay (or, if it must, the board) may hold; never put the instance token in firmware. A local `ironclaw serve` listens on 127.0.0.1 only, so a board on Wi-Fi reaches it through a relay on the Mac, or reaches a hosted instance over HTTPS.

Also useful: **cron** routines ("every hour, summarise the readings and message me on Telegram"), the **heartbeat** for periodic checks, and the Telegram or Slack channel for alerts. A skill about the board (`~/.ironclaw/skills/<name>/SKILL.md`: pins, units, thresholds, contract) teaches the agent the device; skills there are trusted, so write them only with the user's OK.

## Let it act on NEAR, within limits

IronClaw's docs have no built-in NEAR wallet or signer. To let it change state on-chain, give it a **limited sub-account**, like a board (read `near-subaccounts`):

1. Generate an ed25519 key pair **on the IronClaw host** and keep the private key there; only the public key `ed25519:…` leaves it.
2. Create the account in NEAR Hardware (the user approves):

```
near_create_subaccount { "network": "testnet", "name": "claw", "access": "limited",
  "contractId": "greenhouse.alice.testnet", "methodNames": ["set_alert"],
  "allowance": "0.25", "publicKey": "ed25519:<the IronClaw host's public key>" }
```

3. IronClaw signs calls with that key through a tool you give it (near-cli-rs via the shell tool, a WASM tool, or an HTTP MCP server; IronClaw only takes MCP over HTTP(S), stdio servers are refused). NEAR enforces the limits: that contract, those methods, no NEAR transfers, fees capped by the allowance.
4. Reads need no key: NEAR RPC view calls (see `near-devices`).

A clean split: the board records readings with its own key (`sensor.alice.testnet` → `record_reading`), the agent reacts with its key (`claw.alice.testnet` → `set_alert`), and the contract checks `env::predecessor_account_id()` for each method.

## What to ask the user for

- Hosted (they create the agent at https://agent.near.ai) or local (their OK to install, then they run `ironclaw onboard`).
- A NEAR AI Cloud key, entered in IronClaw, if it uses NEAR AI (see `near-ai`).
- `IRONCLAW_URL` and a token or webhook secret in `.env.local`, if the project calls the agent.
- Approval of any limited sub-account for the agent.

## Read more

Search the bundled IronClaw docs: `near_docs_search { "source": "ironclaw", "query": "webhook routine" }`, then `near_docs_read`. Key pages:

- `ironclaw/index.md`, `ironclaw/quickstart.md`, `ironclaw/onboard.md`, `ironclaw/security.md`
- `ironclaw/using/cli.md`, `ironclaw/using/service.md`, `ironclaw/using/webui.md`
- `ironclaw/capabilities/llm-providers.md`, `ironclaw/capabilities/configuration.md`
- `ironclaw/api/responses.md`
- `ironclaw/capabilities/routines/reactive.md`, `cron.md`, `heartbeat.md`; `ironclaw/capabilities/jobs/jobs.md`
- `ironclaw/extensions/mcp.md`, `ironclaw/extensions/shell.md`, `ironclaw/extensions/building-a-tool.md`, `ironclaw/capabilities/sandboxed-tools.md`
- `ironclaw/capabilities/skills.md`, `ironclaw/channels/telegram.md`, `ironclaw/infrastructure/droplet.md`

Related skills: `near-ai`, `near-subaccounts`, `near-devices`, `near-agent-market` (selling the agent's work).
