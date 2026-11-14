> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Storage

> Where IronClaw keeps its data, and when to move to PostgreSQL

IronClaw stores conversations, events, memory, and runtime state locally by default. No
database server is required to get started. Served and multi-user deployments move that
state to PostgreSQL.

***

## Local Storage

Under the default `local-dev` profile, IronClaw keeps state in embedded database files
inside your IronClaw home:

```bash theme={null}
ls ~/.ironclaw/reborn
```

Nothing to install, nothing to configure. Back it up by copying the directory while
IronClaw is stopped.

This is the right choice for personal use on your own machine.

***

## PostgreSQL

Move to PostgreSQL when you serve the web interface to more than one person, run on a
host where local disk is ephemeral, or want a database you can back up and replicate
independently.

**1. Provision a database**

PostgreSQL 15 or later. Managed providers work; so does a local container:

```bash theme={null}
docker run -d --name ironclaw-pg \
  -e POSTGRES_USER=ironclaw \
  -e POSTGRES_PASSWORD=ironclaw \
  -e POSTGRES_DB=ironclaw \
  -p 127.0.0.1:5432:5432 \
  pgvector/pgvector:pg16
```

The `pgvector` image is used so embeddings-backed search works. See
[Memory](https://docs.ironclaw.com/capabilities/memory/memory.md).

**2. Switch to a profile that accepts a database**

Do this **before** you add the `[storage]` block. Only three profiles wire it:
`hosted-single-tenant`, `production`, and `migration-dry-run`. Under any other profile a
`[storage]` block is a startup failure, not a warning:

```
config file section(s) [storage] are parsed but not wired in this runtime slice
```

```toml theme={null}
[boot]
profile = "hosted-single-tenant"
```

Use `production` for a multi-user deployment. See
[Configuration](https://docs.ironclaw.com/capabilities/configuration.md#profiles).

> [!WARNING]
>
> `hosted-single-tenant-volume` does **not** accept `[storage]`, despite the name. It is a
> volume-backed variant of local embedded storage, not a PostgreSQL profile. Pairing it with
> a `[storage]` block leaves the instance unable to start.

**3. Point IronClaw at it**

Put the URL in the environment and name the variable in your configuration:

```bash theme={null}
export IRONCLAW_REBORN_POSTGRES_URL="postgres://ironclaw:ironclaw@127.0.0.1:5432/ironclaw"
```

```toml theme={null}
[storage]
backend               = "postgres"
url_env               = "IRONCLAW_REBORN_POSTGRES_URL"
secret_master_key_env = "IRONCLAW_REBORN_SECRET_MASTER_KEY"
pool_max_size         = 8
```

> [!WARNING]
>
> The URL is environment-only. `config.toml` may name the variable that holds it, but must
> never contain the URL itself — it carries the database password.

**4. Verify**

```bash theme={null}
ironclaw doctor
```

### Connection Security

Managed remote PostgreSQL must use TLS. Append `sslmode=require` to the URL:

```
postgres://user:password@db.example.com:5432/ironclaw?sslmode=require
```

### Pool Sizing

`storage.pool_max_size` defaults to 8. Keep it below your PostgreSQL server's connection
limit — or your managed provider's session-pool cap — after reserving capacity for
restarts and operator sessions. Override it with
`IRONCLAW_REBORN_POSTGRES_POOL_MAX_SIZE`.

The process journal opens **2 additional connections** of its own, outside this
setting. A running turn heartbeats through the journal to keep its lease alive,
and when that heartbeat shared the pool above, one turn's read burst could starve
it until the lease expired and the run failed. Budget `pool_max_size + 2`
connections per running instance.

***

## Secrets and the Master Key

Credentials are encrypted before they reach whichever backend you're using. The master key
that protects them lives in the OS keychain, not the database.

On a headless host with no keychain, provide it explicitly:

```bash theme={null}
export IRONCLAW_REBORN_SECRET_MASTER_KEY=...
```

> [!WARNING]
>
> Losing the master key makes every stored credential unrecoverable. Back it up somewhere
> other than the machine running IronClaw. See [Security](https://docs.ironclaw.com/security.md).

***

## Choosing

| | Local (default) | PostgreSQL |
| - | - | - |
| Setup | None | Provision a server |
| Best for | Personal use, one machine | Served, multi-user, production |
| Backup | Copy the home directory | `pg_dump`, replication |
| Profile | `local-dev` | `hosted-single-tenant`, `production` |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.