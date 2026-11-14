> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Web Interface

> Chat with your agent and manage it from the browser

`ironclaw serve` starts the web interface — the primary way to use IronClaw. It runs on
your own machine and serves the chat, extension management, and settings surfaces.

```bash theme={null}
ironclaw serve
```

By default it binds to `127.0.0.1:3000`, which is reachable only from the local machine.

| Flag | Default | Purpose |
| - | - | - |
| `--host` | `127.0.0.1` | Interface to bind |
| `--port` | `3000` | Port to listen on; `0` picks any free port |
| `--confirm-host-access` | off | Required by the `local-dev-yolo` profile to confirm host filesystem access |

Both `--host` and `--port` override `[webui].listen_host` and `[webui].listen_port` in
your configuration file.

***

## Signing In

Setup writes a bearer token to `~/.ironclaw/reborn/webui-token` and prints a login link:

```
http://127.0.0.1:3000/login?token=<your-token>
```

Open that link once and the browser keeps the session. To retrieve the token later:

```bash theme={null}
cat ~/.ironclaw/reborn/webui-token
```

Set `IRONCLAW_REBORN_WEBUI_TOKEN` to supply your own token instead of the generated file.

> [!WARNING]
>
> The token grants full operator access, including configuration changes. Treat it like a
> password and don't put it in a shared shell history or a URL you paste somewhere.

### Single Sign-On

For deployments with more than one person, IronClaw can authenticate through Google or
GitHub instead of a shared token. Configure a provider with environment variables:

```bash Google theme={null}
export IRONCLAW_REBORN_WEBUI_BASE_URL=https://ironclaw.example.com
export IRONCLAW_REBORN_WEBUI_GOOGLE_CLIENT_ID=...
export IRONCLAW_REBORN_WEBUI_GOOGLE_CLIENT_SECRET=...
# Optional: restrict to one Google Workspace domain
export IRONCLAW_REBORN_WEBUI_GOOGLE_ALLOWED_HD=example.com
```

```bash GitHub theme={null}
export IRONCLAW_REBORN_WEBUI_BASE_URL=https://ironclaw.example.com
export IRONCLAW_REBORN_WEBUI_GITHUB_CLIENT_ID=...
export IRONCLAW_REBORN_WEBUI_GITHUB_CLIENT_SECRET=...
```

Restrict which accounts may sign in with `IRONCLAW_REBORN_WEBUI_ALLOWED_EMAIL_DOMAINS`.

> [!WARNING]
>
> The `export` lines above are shown for clarity. Don't type the client secret into an
> interactive shell in production — it persists in shell history and is visible to child
> processes. Inject these from your service unit, container runtime, or secret manager.

> [!NOTE]
>
> Sign-in sessions carry user identity only. They do not inherit operator configuration
> privileges — the bearer token remains the separate operator credential. A signed-in user
> who is not an operator sees a permission error on configuration surfaces rather than the
> surface itself.

***

## What's In the Interface

**1. Chat**

The default view. Conversations stream as the agent works, showing tool calls and their
results inline. You can cancel or retry a run, and approve requests when the agent asks
permission to do something sensitive.

**2. Workspace**

Browse the files and notes your agent has stored. See [Memory](https://docs.ironclaw.com/capabilities/memory/memory.md)
for how the agent reads and writes this.

**3. Automations**

Recurring and event-driven work the agent performs on its own. See
[Routines](https://docs.ironclaw.com/capabilities/routines/cron.md).

**4. Extensions**

Install, configure, and remove extensions, split into a registry of available packages,
your connected channels, and the tools each extension exposes. See
[Extensions](https://docs.ironclaw.com/extensions/overview.md).

**5. Settings**

Configure inference providers and models, appearance, tool permissions, skills, Trace
Commons participation, and interface language.

**6. Admin**

User management and deployment configuration. Only available to operators; authorization
is enforced on the server, so non-operators get a permission error rather than the page.

## Inspecting a Run

Operators can open the Web Debug Inspector by adding `debug=true` to a chat
URL:

```text theme={null}
http://127.0.0.1:3000/chat/<thread-id>?debug=true
```

The panel shows three views:

* **Prompt** — the bounded prompt assembled by the host, including components,
  active skills, model selection, and estimated context use.
* **Activity** — ordered model and tool lifecycle events. Previous, next, and
  latest buttons navigate runs observed for this thread during the browser
  session.
* **Stats** — available token, latency, model-call, and tool-call totals, plus
  browser-observed stream state, reconnects, update count, and last update.

Expand a completed or failed tool activity to fetch its sanitized arguments
and output from the dedicated operator endpoint. Tool output is limited to 50
KiB and displays its original byte size when truncated. Prompt and tool detail
may contain sensitive user data even after secret scanning, so use this view
only while diagnosing a run and do not copy it into public bug reports.

The inspector is available only to operator sessions and is hidden on mobile.
If it reports **Forbidden**, sign in with the local operator token rather than
an SSO user session. **Unavailable** or an empty historical turn usually means
the process restarted or bounded in-memory evidence was evicted. A temporary
**Reconnecting** state does not affect chat; the stream resumes from its last
cursor or refreshes the bounded snapshot when retained history is no longer
available.

The opt-in is remembered for the browser tab, so it survives route changes and
reloads. Use `?debug=false` to clear it and return to the ordinary chat layout
— simply dropping `debug=true` from the URL leaves the stored opt-in in place.
The inspector is diagnostic only: opening, closing, or navigating it never
changes a run.

> [!NOTE]
>
> Projects, Jobs, Routines, Missions, and Logs have pages in the interface but are not yet
> listed in the sidebar while their APIs are being finished. The underlying capabilities
> work — see the [Capabilities](https://docs.ironclaw.com/capabilities/overview.md) section.

***

## Exposing It Beyond Your Machine

`serve` binds to loopback on purpose. To reach it from elsewhere, either bind a different
interface or put it behind a tunnel:

```bash theme={null}
ironclaw serve --host 0.0.0.0 --port 3000
```

> [!WARNING]
>
> Binding a non-loopback interface makes the web interface reachable by anything that can
> route to the host. Put it behind TLS and configure single sign-on before you do this —
> a shared bearer token on an open port is a full compromise of the agent and every
> credential it holds.

A safer path that opens no port at all is an SSH tunnel from the machine you're browsing
from:

```bash theme={null}
ssh -N -L 3000:127.0.0.1:3000 you@your-host
```

Then open `http://127.0.0.1:3000` locally.

> [card] [CLI Reference](https://docs.ironclaw.com/using/cli.md)
>
> Every command the binary provides.

> [card] [Run as a Service](https://docs.ironclaw.com/using/service.md)
>
> Keep IronClaw running in the background.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.