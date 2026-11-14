> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# MCP Servers

> Connect Model Context Protocol servers to extend IronClaw

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard for tool
servers, with a growing ecosystem covering databases, APIs, and cloud services. IronClaw
adapts MCP tools into agent capabilities.

MCP is one of the runtimes an extension can declare, alongside WASM and first-party. An MCP
server reaches your agent by being packaged as an extension whose manifest declares its
tools and endpoint — there is no separate MCP server registry.

***

## Adding a Server

Install and activate the extension that wraps the MCP server:

```bash theme={null}
ironclaw extension search notion
ironclaw extension install notion
ironclaw extension activate notion
```

Then complete any credential setup from **Extensions** in the
[web interface](https://docs.ironclaw.com/using/webui.md). Once activated, the server's tools appear alongside every
other tool the agent can call.

Remove it the same way you remove any extension:

```bash theme={null}
ironclaw extension remove notion
```

***

## Transport

IronClaw connects to MCP servers over **HTTP(S)** using JSON-RPC 2.0.

> [!WARNING]
>
> The `stdio` transport is not supported. IronClaw rejects it rather than spawning a local
> server process, because process-level egress controls have not landed yet. A server that
> only speaks stdio cannot be connected today.

***

## Security

MCP servers are untrusted. A server does not gain ambient filesystem, secret, or network
authority just because the agent can call its tools:

* Calls go through the host-selected client, which is the only integration point
* Outbound requests are planned and authorized by the host's egress controls, not by the
  server
* Resource use is accounted through the host governor like any other capability
* Credentials are injected at the egress boundary and redacted from results and errors

See [Security](https://docs.ironclaw.com/security.md) and [Sandboxed Tools](https://docs.ironclaw.com/capabilities/sandboxed-tools.md).

***

## WASM or MCP?

| | WASM extension | MCP extension |
| - | - | - |
| Runs | Sandboxed inside IronClaw | On a remote server over HTTP |
| Best for | Deterministic logic, offline work, tight sandboxing | Existing MCP servers and hosted SaaS tools |
| Network | Allowlisted egress from the sandbox | The server's own endpoint |
| Latency | In-process | A network round trip |

Prefer a WASM extension when you're writing the tool yourself and want it sandboxed. Use
MCP when the tool already exists as an MCP server.

See [Building an Extension](https://docs.ironclaw.com/extensions/building-a-tool.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.