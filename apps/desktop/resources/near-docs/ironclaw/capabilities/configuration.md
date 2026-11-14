> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuration

> How IronClaw is configured and where each setting lives

IronClaw is configured by a file in your IronClaw home directory, not by a long list of
environment variables. Environment variables exist to override individual values and to
carry secrets.

***

## Where Configuration Lives

Everything lives under `~/.ironclaw/reborn`. Override the location with
`IRONCLAW_REBORN_HOME`.

```bash theme={null}
ironclaw config path
```

```
reborn_home:  ~/.ironclaw/reborn
home_source:  default
profile:      local-dev
config_file:  ~/.ironclaw/reborn/config.toml
providers:    ~/.ironclaw/reborn/providers.json
```

Two files matter, and both are optional — delete them and IronClaw falls back to built-in
defaults.

| File | Layer | Contents |
| - | - | - |
| `config.toml` | Selection | Which profile, identity, model slot, and runtime settings to use |
| `providers.json` | Catalog | Which inference providers this install knows about |

`config.toml` selects *by id* from the catalog `providers.json` defines. The compiled-in
provider defaults are appended with your entries, and later entries override earlier ones
by id.

***

## Precedence

Each field resolves through four layers, later winning over earlier:

```
compiled defaults  <  config.toml  <  environment variables  <  CLI flags
```

So `ironclaw serve --port 3100` beats the port in `config.toml`, which beats the built-in
default of `3000`.

***

## Editing Configuration

Generate a commented starter file:

```bash theme={null}
ironclaw config init
```

It refuses to overwrite existing files unless you pass `--force`.

Read and write individual keys with dot-separated paths:

```bash theme={null}
ironclaw config list
ironclaw config get llm.default.provider_id
```

`list` and `get` read every key. `set` is deliberately narrower — it accepts only the keys
that have a routing destination:

| Key | Destination |
| - | - |
| `<provider>.api_key` | Encrypted secret store (prompts, hidden) |
| `google.client_id`, `google.redirect_uri` | `config.toml` |
| `google.client_secret` | Encrypted secret store (prompts, hidden) |
| `webui.token --rotate` | Web token file |

```bash theme={null}
ironclaw config set google.client_id <your-client-id>
```

Everything else — `runner.*`, `webui.listen_port`, `budget.*`, `[llm.default]` — is edited
in `config.toml` directly. `config set` rejects an unsupported key rather than silently
doing nothing.

Secret-destination keys (`<provider>.api_key`, `google.client_secret`) reject a value on
the command line and always prompt with input hidden, so the secret never reaches your
shell history.

### Applying a Change

`config set` never restarts anything. It writes the value and prints the step you still
have to run:

```
  to apply: ironclaw service restart
```

Until you do, a running instance keeps serving the old value.

> [tab] NEAR AI hosted instance
>
> `ironclaw service` commands do **not** work on a NEAR AI hosted instance — there is no
> user service manager for them to talk to, so `service restart` fails rather than
> restarting anything.
>
> SSH in only to run the `ironclaw config` commands, then restart the agent from the
> [Agent Dashboard](https://agent.near.ai/). That is the only way to restart a hosted
> instance.

> [tab] Self-hosted
>
> ```bash theme={null}
> ironclaw service restart
> ```
>
> Or stop and restart `ironclaw serve` if you're running it in the foreground.

***

## Secrets

Secrets are never stored in `config.toml`. Reference them by environment variable *name*:

```toml theme={null}
[llm.default]
provider_id = "anthropic"
model       = "claude-sonnet-4-20250514"
api_key_env = "ANTHROPIC_API_KEY"
```

> [!WARNING]
>
> Pasting a secret value where a variable name is expected is rejected at parse time, not
> silently accepted. `api_key_env = "sk-ant-..."` will fail to load.

Your master encryption key lives in the OS keychain. On a headless host, supply it through
`IRONCLAW_REBORN_SECRET_MASTER_KEY`. See [Security](https://docs.ironclaw.com/security.md).

***

## Profiles

A profile selects a composition of runtime behavior — how capabilities are mediated, what
storage is expected, and how processes are isolated.

```bash theme={null}
ironclaw profile list
```

| Profile | Use |
| - | - |
| `local-dev` | Default. Single user on your own machine |
| `local-dev-yolo` | Local development with host filesystem access; `serve` requires `--confirm-host-access` |
| `hosted-single-tenant` | One tenant served over the network, backed by PostgreSQL |
| `hosted-single-tenant-volume` | One tenant served over the network, keeping local embedded storage on a persistent volume. Does not accept `[storage]` |
| `production` | Multi-user production deployment |
| `migration-dry-run` | Migration rehearsal |

Set it in `config.toml` under `[boot]`, or per-invocation with `IRONCLAW_REBORN_PROFILE`.

> [!WARNING]
>
> Profile choice is a security boundary, not a preset. A deployment that serves more than
> one user must not run a profile with single-user host semantics. See
> [Security](https://docs.ironclaw.com/security.md).

***

## Configuration Reference

Run `ironclaw config list` to see every key with its current value. The main groups:

> [accordion] boot, identity
>
> ```toml theme={null}
> [boot]
> profile = "local-dev"
>
> [identity]
> default_owner = "reborn-cli"
> ```
>
> `identity.tenant` and `identity.default_agent` are optional overrides for the tenant and
> agent ids the runtime operates under. Leave them unset unless you know you need a
> different scope — a stale value here silently moves your work into another identity scope.
>
> `identity.default_project` is consumed by `serve` but not by `run` or `repl`; those two
> subcommands fail on startup rather than silently dropping it.

> [accordion] llm — model selection
>
> ```toml theme={null}
> [llm.default]
> provider_id = "nearai"
> model       = "deepseek-ai/DeepSeek-V4-Flash"
> api_key_env = "NEARAI_API_KEY"
> ```
>
> No slot is configured by default, so IronClaw falls back to provider environment variables
> until you set one.
>
> Uncommenting only the `[llm.default]` header with no fields does **not** fall through to
> the environment — an empty slot is still present, and resolution fails with a
> missing-provider-id error. Always set `provider_id` together with the header.
>
> See [Inference Providers](https://docs.ironclaw.com/capabilities/llm-providers.md).

> [accordion] storage — database backend
>
> ```toml theme={null}
> [storage]
> backend               = "postgres"
> url_env               = "IRONCLAW_REBORN_POSTGRES_URL"
> secret_master_key_env = "IRONCLAW_REBORN_SECRET_MASTER_KEY"
> pool_max_size         = 8
> ```
>
> The database URL is environment-only; this file may name the variable but must never
> contain the URL itself. See [Storage](https://docs.ironclaw.com/capabilities/database.md).

> [accordion] runner — concurrency and timing
>
> ```toml theme={null}
> [runner]
> heartbeat_interval_secs = 15
> poll_interval_ms        = 200
> ```
>
> Also `worker_count`, `max_concurrent_runs_per_user`, `max_concurrent_conversation_runs`,
> and `max_concurrent_trigger_runs`. Those four have `IRONCLAW_REBORN_RUNNER_*` environment
> overrides; `heartbeat_interval_secs` and `poll_interval_ms` are file-only.

> [accordion] budget — cost controls
>
> Caps agent spend so a runaway loop can't run up a bill:
>
> * `budget.user_daily_usd`, `budget.project_daily_usd`
> * `budget.warn_at`, `budget.pause_at`
> * `budget.heartbeat_per_tick_usd`, `budget.mission_per_tick_usd`
> * `budget.routine_standard_usd`, `budget.routine_lightweight_usd`
> * `budget.background_job_default_usd`, `budget.overestimate_factor`, `budget.default_tz`

> [accordion] trigger\_poller — scheduled work
>
> Controls how scheduled and event-driven work is picked up: `enabled`,
> `poll_interval_secs`, `fires_per_tick`, `max_concurrent_fires_per_trigger`,
> `startup_jitter_max_secs`, `tick_jitter_max_secs`.
>
> See [Routines](https://docs.ironclaw.com/capabilities/routines/cron.md).

> [accordion] channels and providers
>
> Channels are not configured in this file. Slack and Telegram are turned on by installing
> their extension in the web interface and completing setup — there is no `[slack]` or
> `[telegram]` section, and no key that enables a channel. The retired `[slack]` setup keys
> are rejected outright: a config file that still carries them makes `ironclaw serve`
> refuse to start, with a migration pointer. See
> [Channels](https://docs.ironclaw.com/channels/overview.md).
>
> `google.*` carries the OAuth client id, redirect URI, and hosted-domain hint. Set it either
> from the web interface or with `ironclaw config set google.client_id` /
> `google.client_secret` / `google.redirect_uri` — both paths are supported.

> [accordion] skills
>
> ```toml theme={null}
> [skills]
> regex_activation_enabled = true
> ```
>
> When false, regex activation criteria no longer auto-load full skill context. Keyword and
> tag activation, and explicit `$skill-name` mentions, still work. See
> [Skills](https://docs.ironclaw.com/capabilities/skills.md).

***

## Environment Variables

Overrides are namespaced `IRONCLAW_REBORN_*`. The ones you're most likely to need:

| Variable | Purpose |
| - | - |
| `IRONCLAW_REBORN_HOME` | Where configuration and state live |
| `IRONCLAW_REBORN_PROFILE` | Boot profile |
| `IRONCLAW_REBORN_LOG` | Log level, for example `debug` |
| `IRONCLAW_REBORN_POSTGRES_URL` | Database URL when using the Postgres backend |
| `IRONCLAW_REBORN_SECRET_MASTER_KEY` | Master encryption key on hosts without a keychain |
| `IRONCLAW_REBORN_WEBUI_TOKEN` | Bearer token for the web interface |
| `IRONCLAW_REBORN_WEBUI_BASE_URL` | Canonical URL when running behind a proxy |

Provider API keys use each provider's own variable name — `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `NEARAI_API_KEY`, and so on.

***

## Checking Your Configuration

```bash theme={null}
ironclaw doctor
```

Reports the resolved home and profile, whether each configuration file was found, and
whether each driver initialized — without creating any state.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.