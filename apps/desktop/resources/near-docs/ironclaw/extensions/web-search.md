> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Web Access

> Let your agent search the web and read pages

The Web Access extension lets your agent search the web and retrieve full page content,
so it can answer questions about current events, look up specific data, and cite its
sources.

It needs no credentials. There is no API key to obtain and no account to create — install
it, activate it, and the tools are available.

***

## Setup

**1. Install the extension**

```bash theme={null}
ironclaw extension install web-access
```

> [!NOTE]
>
> The extension id is `web-access`, not `web-search`. Run `ironclaw extension search web`
> to confirm the id your install knows about.

**2. Activate it**

```bash theme={null}
ironclaw extension activate web-access
```

Activation publishes the tools to the agent. Because no credentials are involved, there
is nothing to supply afterwards.

You can do both steps from **Extensions** in the [web interface](https://docs.ironclaw.com/using/webui.md) instead.

***

## What the Agent Can Do

| Capability | Description |
| - | - |
| `web-access.search` | Search the web and return results with citations |
| `web-access.get_content` | Retrieve a page's full content, or re-read a page cached from an earlier search |

Both are allowed by default once the extension is active.

> [!TIP]
>
> For GitHub repositories, issues, pull requests, releases, or workflow data, the
> [GitHub extension](https://docs.ironclaw.com/extensions/github.md) returns better-structured results than a web
> search. Install it if your agent works with GitHub regularly.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.