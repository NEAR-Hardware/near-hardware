> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Onboard

> Initialize your agent's home directory and first-run settings

`ironclaw onboard` is the one-time setup command. It creates your IronClaw home
directory, writes a starter configuration, provisions the token used to sign in to the
web interface, and walks you through choosing an inference provider.

Run it once after installing. Running it again is safe — it preserves your existing
`config.toml` and `providers.json` unless you pass `--force`.

> [!NOTE]
>
> If you haven't installed IronClaw yet, follow the [Quickstart](https://docs.ironclaw.com/quickstart.md) first.

***

## Running Onboarding

```bash theme={null}
ironclaw onboard
```

**1. Home Directory**

Onboarding resolves your IronClaw home — `~/.ironclaw/reborn` by default — and creates it
if it doesn't exist. Override the location with the `IRONCLAW_REBORN_HOME` environment
variable.

**2. Configuration Files**

Two files are written into that directory:

* `config.toml` — the selection layer: boot profile, identity, model slots, runner timing
* `providers.json` — the catalog of inference providers this install knows about

Both are optional at runtime; if you delete them, IronClaw falls back to built-in
defaults. See [Configuration](https://docs.ironclaw.com/capabilities/configuration.md).

**3. Master Key**

Your master encryption key is provisioned in the OS keychain, where it protects every
credential IronClaw stores. It is never written to `config.toml`.

On a headless host without a keychain, supply the key through the
`IRONCLAW_REBORN_SECRET_MASTER_KEY` environment variable instead.

**4. Inference Provider**

In an interactive terminal, onboarding asks which provider and model to use and stores
your API key. Non-interactive sessions skip this step — see below.

**5. Web Login Token**

A bearer token is written to `webui-token` and used by `ironclaw serve` whenever
`IRONCLAW_REBORN_WEBUI_TOKEN` is unset. Onboarding prints a ready-to-use login link:

```
login_link: http://127.0.0.1:3000/login?token=<your-token>
```

**6. System Service**

In an interactive session, onboarding offers to install and start IronClaw as an
OS-native service (launchd on macOS, systemd on Linux) so it runs in the background. The
installed unit runs `ironclaw serve`.

Skip it with `--no-service`, or manage it later with `ironclaw service install`,
`start`, `stop`, `restart`, `status`, and `uninstall`.

> [!NOTE]
>
> Decline this on a **NEAR AI hosted instance**, or pass `--no-service`. The agent already
> runs there, and `ironclaw service` has no user service manager to talk to, so every
> `service` subcommand fails. Start, stop, and restart a hosted agent from the
> [Agent Dashboard](https://agent.near.ai/).

***

## Options

| Flag | Effect |
| - | - |
| `--force` | Overwrite `config.toml`, `providers.json`, and the completion marker |
| `--dry-run` | Print what would be written without touching the filesystem |
| `--no-service` | Skip installing and starting the OS service |
| `--import-history` | Reserve the history-import step in the summary |

> [!WARNING]
>
> `--force` replaces your configuration files. Any provider selection, model choice, or
> channel settings you edited by hand are lost.

> [!NOTE]
>
> `--import-history` is not wired up yet. The flag records the intent in the onboarding
> summary so the missing step is explicit, but no history is imported.

***

## Non-interactive Setup

In CI, a container, or any piped invocation, onboarding detects the non-interactive
session and skips both the provider prompts and the service install:

```bash theme={null}
ironclaw onboard --no-service < /dev/null
```

It reports what remains:

```
remaining:
- configure LLM credentials: rerun `ironclaw onboard` from an interactive terminal,
  run `ironclaw models set-provider <provider> --model <model>` directly, or export a
  provider's LLM environment variables before the next `onboard`/`serve`
```

Configure the provider yourself with either approach:

```bash theme={null}
ironclaw models set-provider anthropic --model claude-sonnet-4-20250514
```

```bash theme={null}
export ANTHROPIC_API_KEY=sk-ant-...
```

***

## Verifying Setup

Check what onboarding produced and confirm the runtime is healthy:

```bash theme={null}
ironclaw config path
ironclaw doctor
```

`doctor` reports your home directory, active profile, whether configuration files were
found, and whether each driver initialized.

***

## What Onboarding Doesn't Set Up

Onboarding covers the runtime: home directory, configuration, master key, inference
provider, web token, and optionally the OS service. It does **not** connect messaging
channels.

Slack and Telegram are connected afterwards, in the web interface:

**Admin → Configuration → fill in the channel's deployment configuration card → Save**

Two things trip people up here:

* **The channel's own Configure button covers only pairing.** Using **Configure** on
  Telegram from the Extensions page opens the pairing panel, which can only report
  *"An administrator must configure the Telegram bot first."* until the deployment
  configuration under **Admin → Configuration** is saved. That is not a permissions
  problem — the operator step just hasn't happened yet.
* **Asking the agent to connect a channel covers only the personal half.** The operator
  step — saving the app or bot credentials for the instance — stays in the web
  interface. Once that's done, asking the agent ("connect Slack") works: it installs and
  activates the extension, an in-chat connection panel opens if your account still needs
  OAuth, and if your account is already connected the agent says so and continues.

See [Channels](https://docs.ironclaw.com/channels/overview.md) for the full walkthrough.

> [card] [Configuration](https://docs.ironclaw.com/capabilities/configuration.md)
>
> Every configuration key and how precedence works.

> [card] [Inference Providers](https://docs.ironclaw.com/capabilities/llm-providers.md)
>
> Choose and configure your model provider.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.