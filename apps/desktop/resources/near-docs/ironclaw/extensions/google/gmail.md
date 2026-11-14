> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Gmail

> Let your agent read, send, and manage your Gmail messages

The Gmail extension allows your agent to interact with your Gmail inbox — listing and searching messages, reading full email content, sending new emails, creating drafts, replying to threads, and trashing messages. It's ideal for automating email workflows, monitoring important threads, or sending notifications directly from your agent.

***

## Setup

If you haven't set up Google OAuth yet, complete the [Google OAuth Setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first.

**1. Enable the Gmail API**

In your Google Cloud project, navigate to **APIs & Services → Library**, search for **Gmail API**, and click **Enable**.

**2. Install the Extension**

```bash theme={null}
ironclaw extension install gmail
```

**3. Authorize Access**

```bash theme={null}
ironclaw extension activate gmail
```

Activating an extension that needs credentials starts its setup flow. Complete it from **Extensions** in the [web interface](https://docs.ironclaw.com/using/webui.md) — for Google services that means the OAuth consent screen. Follow the [auth setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first so your agent can capture the callback. Tokens are stored encrypted and refreshed automatically.

> [!TIP]
>
> If you already authenticated one Google service, you still need to authenticate each additional Google extension separately.

***

## Available Actions

* `list_messages`: List messages in your inbox with an optional Gmail search query, label filter, and result limit
* `get_message`: Read the full content of a message by ID, including headers, body, and labels
* `send_message`: Send a new email with recipient(s), subject, body, and optional CC addresses
* `create_draft`: Save a message as a draft without sending it
* `reply_to_message`: Reply to an existing message thread, keeping the conversation history intact
* `trash_message`: Move a message to the trash

***

## Example Usage

Once configured, you can ask your agent things like:

* *"What emails did I receive from [alice@example.com](mailto:alice@example.com) this week?"*
* *"Read my latest unread message"*
* *"Send an email to [bob@example.com](mailto:bob@example.com) with subject 'Meeting Notes' and a summary of today's discussion"*
* *"Draft a follow-up to the project proposal thread"*
* *"Reply to the last message in the invoice thread saying the payment has been processed"*
* *"Trash all emails from [noreply@newsletter.com](mailto:noreply@newsletter.com)"*

***

## Gmail Search Syntax

The `list_messages` action accepts standard Gmail search queries in the `query` field:

| Query | Matches |
| - | - |
| `from:alice@example.com` | Messages from Alice |
| `subject:invoice` | Messages with "invoice" in the subject |
| `is:unread` | Unread messages |
| `label:work` | Messages with the "work" label |
| `after:2025/01/01` | Messages received after January 1, 2025 |
| `has:attachment` | Messages with attachments |

> [!TIP]
>
> You can combine queries: `from:alice@example.com is:unread` lists all unread messages from Alice.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.