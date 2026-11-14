> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> Reach your agent from a messaging app

Channels let people reach your agent from somewhere other than the web interface. IronClaw
supports Slack and Telegram.

> [card] [Slack](https://docs.ironclaw.com/channels/slack.md)
>
> Talk to your agent in Slack channels and direct messages.

> [card] [Telegram](https://docs.ironclaw.com/channels/telegram.md)
>
> Talk to your agent in Telegram direct messages and group chats.

***

## How Channels Work

A channel is one capability surface of an extension. Installing the Slack or Telegram
extension gives your agent the ability to receive and send messages there; the extension's
manifest declares the channel surface alongside any tools it provides.

Setup happens in the [web interface](https://docs.ironclaw.com/using/webui.md). Start the server, connect the channel,
and the setup flow walks you through the credentials it needs and stores them encrypted.

```bash theme={null}
ironclaw serve
```

> [!NOTE]
>
> Channel credentials are stored in the encrypted secret store, not in `config.toml`. Your
> configuration file names the environment variables that hold them, never the values
> themselves. See [Security](https://docs.ironclaw.com/security.md).

***

## Where Channel Setup Lives

This is the single most common thing to get stuck on, so it's worth being precise.
Channel setup has two halves, done in two different places:

**1. Operator half: Admin → Configuration (once per instance)**

In the sidebar, open **Admin**, then **Configuration**. Each channel that needs
deployment credentials shows a configuration card there — **Telegram deployment
configuration**, **Slack deployment configuration**, and so on. Fill in the card's
fields and save. The values are stored in the encrypted secret store.

This is the half the whole instance shares: the Telegram bot token and webhook
settings, the Slack app credentials.

**2. Personal half: Extensions (each person)**

Open **Extensions**, install the channel's extension, and use **Connect** /
**Configure** on its card. For Telegram this opens the *pairing* panel that links your
Telegram account to your IronClaw user; for Slack it runs your personal OAuth
connection. You can also just ask the agent in chat — it drives this half for you.

### The One Dead End to Know About

> [accordion] "An administrator must configure the Telegram bot first"
>
> The pairing panel assumes the deployment configuration is already saved. If it isn't,
> the only thing that surface can do is report:
>
> ```
> An administrator must configure the Telegram bot first.
> ```
>
> That message is accurate but misleading — it reads like you lack permission. Nothing is
> wrong with your account. Complete the operator half under **Admin → Configuration**
> first, then pair.

> [accordion] Asking the agent to connect only works after the operator step
>
> "Connect Slack" in chat does work for the *personal* half of setup: the agent installs
> and activates the extension, and if your account still needs OAuth or pairing an
> in-chat connection panel opens right there. If your account is already connected, the
> agent confirms that and continues with your request.
>
> What the agent cannot do is the *operator* half — the deployment credentials under
> **Admin → Configuration**. That step is deliberately kept out of the tools the agent
> can drive, so it stays in the web interface where you can see what you're authorizing.
> If chat setup dead-ends, complete the operator step first, then ask again.

> [!NOTE]
>
> Telegram has **two** setup steps that are easy to confuse: an operator saves the
> deployment configuration once for the whole instance, and then each person pairs their
> own Telegram account to their IronClaw user. The "administrator must configure" error
> means step one hasn't happened yet.

***

## Receiving Messages

Both channels deliver events by webhook, so the messaging platform needs to reach your
IronClaw instance over HTTPS. On a laptop behind NAT that means either a public host or a
forwarding service; a served deployment already has a reachable URL.

Each channel's page covers the exact callback URL to register.

***

## Not Using a Channel?

You don't need one. The [web interface](https://docs.ironclaw.com/using/webui.md) and the terminal both talk to the
same agent:

```bash theme={null}
ironclaw repl
ironclaw run -m "What's on my calendar today?"
```

> [!NOTE]
>
> Discord, Signal, WeChat, and WeCom were available in IronClaw v1 and are not part of the
> 1.0 release. If you depend on one of them, stay on v1 until it returns.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.