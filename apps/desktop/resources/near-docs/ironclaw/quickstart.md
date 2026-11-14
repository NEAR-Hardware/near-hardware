> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Create your first Agent in minutes

This guide covers both ways to run IronClaw: spin up a private instance on the Agent Hub with no installation, or install the binary on your own machine.

***

## Agent Hub (Recommended)

The fastest way to use IronClaw — no setup, no installation.

### 1. Sign in

Go to [agent.near.ai](https://agent.near.ai/) and log in. Once logged in, create a new IronClaw agent. A private instance is provisioned for you.

> [accordion] SSH Key
>
> You will need to provide an SSH key to connect to your private instance. If you don't have one:
>
> ```bash theme={null}
> ssh-keygen -t rsa -b 4096 -C "you@example.com"
> cat ~/.ssh/id_rsa.pub
> ```

> [accordion] Issues Connecting?
>
> Add your SSH key to your device's SSH agent before connecting:
>
> ```bash theme={null}
> ssh-add ~/.ssh/id_rsa
> ```

### 2. Talk to your agent

Your agent is already running. You have two ways to interact:

**Web interface (recommended):** Your [Agent Dashboard](https://agent.near.ai/) shows a web gateway link — open it in your browser for the full IronClaw WebChat experience.

```
https://<instance-id>.agents.near.ai
```

**Terminal:** Connect via SSH using the details shown in your dashboard, then start a chat session:

```bash theme={null}
ssh -p <PORT> <username>@<host>
ironclaw chat
```

For one-shot commands:

```bash theme={null}
ironclaw run -m "Summarize my last three emails"
```

### 3. Manage your agent

Use the [Agent Dashboard](https://agent.near.ai/) to start, stop, or restart your instance. Updates are handled automatically by the platform.

***

## Installing locally

For personal use on your own machine with full control.

### 1. Install IronClaw

Install the single binary:

```bash theme={null}
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/nearai/ironclaw/releases/latest/download/ironclaw-installer.sh | sh
```

On Windows, use the PowerShell installer:

```powershell theme={null}
irm https://github.com/nearai/ironclaw/releases/latest/download/ironclaw-installer.ps1 | iex
```

Verify the install:

```bash theme={null}
ironclaw --version
```

### 2. Run setup

Create your IronClaw home directory, provision a login token, and choose your inference provider:

```bash theme={null}
ironclaw onboard
```

When it finishes it prints a login link containing your token:

```
login_link: http://127.0.0.1:3000/login?token=<your-token>
```

> [!NOTE]
>
> We recommend using [NEAR AI](https://cloud.near.ai/) as your inference provider for
> maximum privacy and security. See [Inference Providers](https://docs.ironclaw.com/capabilities/llm-providers.md) for
> the full list of supported providers.

> [accordion] What onboarding creates
>
> Everything lives under `~/.ironclaw`:
>
> | File | Purpose |
> | - | - |
> | `config.toml` | Your configuration — profile, identity, model selection |
> | `providers.json` | The catalog of inference providers available to this install |
> | `webui-token` | Bearer token used by the web interface |
> | `.onboard-completed.json` | Marks setup as complete |
>
> Your master encryption key is stored in the OS keychain, not on disk. See
> [Security](https://docs.ironclaw.com/security.md).

> [accordion] Running setup non-interactively
>
> In a script or CI, onboarding skips the interactive prompts and the service install:
>
> ```bash theme={null}
> ironclaw onboard --no-service < /dev/null
> ```
>
> Configure your provider separately with `ironclaw models set-provider <provider> --model <model>`,
> or by exporting the provider's environment variables before running `serve`.
>
> Use `--dry-run` to see exactly what would be written without touching the filesystem.

### 3. Start the agent

Start the web interface:

```bash theme={null}
ironclaw serve
```

By default it listens on `127.0.0.1:3000` — local only. Open the login link from the
previous step in your browser, and you'll land in the chat interface.

> [accordion] ⚠️ Port already in use
>
> If port 3000 is taken, pass a different one:
>
> ```bash theme={null}
> ironclaw serve --port 3100
> ```
>
> Use `--port 0` to let the operating system pick any free port.

> [accordion] Lost your login link?
>
> Print your configuration paths and read the token back:
>
> ```bash theme={null}
> ironclaw config path
> cat ~/.ironclaw/webui-token
> ```
>
> Then visit `http://127.0.0.1:3000/login?token=<token>`.

### 4. Chat with your agent

Type a message in the chat and the agent will respond. From here you can also reach
Projects, Jobs, Routines, and Settings from the sidebar.

If you prefer the terminal, IronClaw has a REPL and a one-shot mode:

```bash theme={null}
ironclaw repl
ironclaw run -m "Summarize my last three emails"
```

### 5. Keep it running

To have IronClaw start automatically in the background, install it as a system service
(launchd on macOS, systemd on Linux):

> [!WARNING]
>
> Stop the foreground `ironclaw serve` first. The service runs `serve` too, so starting it
> while your terminal still holds the port fails with an address-already-in-use error.

```bash theme={null}
# Ctrl-C the foreground server, then:
ironclaw service install
ironclaw service start
ironclaw service status
```

### 6. Update IronClaw

Update to the latest release:

```bash theme={null}
ironclaw-update
```

***

## Next Steps

Now that your agent is running, connect a [channel](https://docs.ironclaw.com/channels/overview.md) so you can reach
it from a messaging app, and add [extensions](https://docs.ironclaw.com/extensions/overview.md) to give it more
capabilities.

> [card] [Channels](https://docs.ironclaw.com/channels/overview.md)
>
> Connect your agent to Slack or Telegram.

> [card] [Extensions](https://docs.ironclaw.com/extensions/overview.md)
>
> Give your agent access to external APIs and services.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.