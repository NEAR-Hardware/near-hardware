> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Telegram

> Interact with your agent through Telegram

Connect IronClaw to a Telegram bot so your agent can receive and reply to messages in
direct messages and group chats.

## Prerequisites

* A Telegram account
* An IronClaw instance reachable from Telegram over public HTTPS with a valid
  certificate. A local installation works too — put a tunnel (for example
  [ngrok](https://ngrok.com) or
  [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/))
  in front of it; see the webhook step below.

***

## Setup

**1. Create a bot**

Message [BotFather](https://t.me/botfather) and send `/newbot`. Choose a name and a
username ending in `bot`. BotFather replies with a token that looks like
`123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`. Keep both the token and the username handy —
the configuration form asks for each.

> [!WARNING]
>
> The bot token is a full credential for your bot. Anyone holding it can read and send
> messages as your agent. Don't paste it into a shared channel or commit it to a repository.

**2. Start IronClaw**

```bash theme={null}
ironclaw serve
```

**3. Expose a local instance over HTTPS (local installations only)**

Skip this step if your instance already has a public HTTPS address. Otherwise, put a
tunnel in front of it. The easiest setup is ngrok — free accounts get one
automatically assigned development domain (you don't pick the name; it's shown in the
dashboard and in the agent's output):

```bash theme={null}
brew install ngrok                          # or see ngrok.com/download
ngrok config add-authtoken <your-token>     # token from dashboard.ngrok.com
ngrok http 3000
```

Use the port IronClaw listens on — `3000` unless you changed `listen_port`. Copy the
HTTPS address ngrok prints (something like `https://<assigned-name>.ngrok-free.app`)
and append the webhook path — that's your webhook URL for the next step:

```
https://<assigned-name>.ngrok-free.app/webhooks/extensions/telegram/updates
```

If your tunnel's hostname ever changes (a random `trycloudflare.com` quick tunnel, or
a reserved domain you move to), update the **Public webhook URL** field and save again
— saving re-registers the webhook with Telegram automatically. Paid ngrok plans can
pin a reserved domain with `ngrok http --url=https://<your-domain> 3000`.

> [!NOTE]
>
> Alternatives: `tailscale funnel 3000` gives a stable `https://<machine>.<tailnet>.ts.net`
> address if you already use Tailscale, and `cloudflared tunnel --url http://localhost:3000`
> is a zero-signup option for a quick test (random hostname each start). The tunnel
> exposes your whole IronClaw instance, not just the webhook path — the WebUI still
> requires your access token and the Telegram route rejects calls without your webhook
> secret, but don't share the hostname more widely than needed.

**4. Enter the deployment configuration (operator, once per instance)**

In the [web interface](https://docs.ironclaw.com/using/webui.md), open **Admin → Configuration** and find the
**Telegram deployment configuration** card. It has four required fields:

| Field | What to enter |
| - | - |
| **Bot token** | The token BotFather issued in step 1. |
| **Webhook secret token** | A value **you invent** — any random string of 1–256 letters, digits, `_` or `-` (for example the output of `openssl rand -hex 32`). IronClaw registers it with Telegram, and Telegram echoes it back on every delivery so forged webhook calls are rejected. |
| **Public webhook URL** | The full HTTPS address Telegram delivers updates to: `https://your-host/webhooks/extensions/telegram/updates`. For a local installation, use your tunnel's public hostname here. |
| **Bot username** | Your bot's username **without the leading @** (5–32 characters, ending in `bot`). Used for the pairing deep link and group mentions. |

Save the configuration. The values are stored in the encrypted secret store, and the
webhook is registered with Telegram when the extension activates.

> [!NOTE]
>
> Telegram only delivers webhooks to a publicly reachable HTTPS endpoint with a valid
> certificate, on port 443, 80, 88, or 8443. It will not deliver to a self-signed
> endpoint or a private address — this is why a local installation needs a tunnel.

**5. Install the extension**

Open **Extensions**, find **Telegram**, and install it — or simply ask the agent in
chat to set up Telegram. Activation registers the webhook with Telegram using the
configuration you saved; it fails with a clear error if any of the four fields is
missing or invalid.

**6. Pair your account (each person)**

Configuring the bot does not connect *you* to it. Pairing is a separate step that tells
IronClaw which Telegram user corresponds to which IronClaw user. Open the pairing panel
in the web interface and follow its link or QR code, or start a chat with your bot and
send `/start` followed by the displayed code.

Pairing is what stops a stranger who finds your bot from talking to your agent as you.

**7. Talk to it**

Send your bot a direct message. To use it in a group, add the bot to the group — by
default Telegram bots only see messages that mention them.

***

## Configuration

Telegram has no settings in `config.toml` and no CLI enablement key. The
ingress route is compiled in and mounted unconditionally; it starts serving
once the deployment configuration is saved and the Telegram extension is
active (see the steps above). Until then it returns `503`.

The bot token and webhook secret live in the encrypted secret store, not in
`config.toml`. See [Configuration](https://docs.ironclaw.com/capabilities/configuration.md).

> [!NOTE]
>
> A `[telegram]` section left over from an older release still parses, but
> nothing reads it — `ironclaw serve` logs a deprecation notice on boot.
> Delete the section to silence it.

***

## Troubleshooting

> [accordion] The bot never replies
>
> Telegram delivers updates by webhook, so your instance must be reachable over HTTPS with a
> valid certificate on port 443, 80, 88, or 8443. Telegram will not deliver to a
> self-signed endpoint or a private address. For a local installation, check that your
> tunnel is running and that the **Public webhook URL** field matches its current public
> hostname — free tunnel hostnames often change on restart.

> [accordion] It works in DMs but not in a group
>
> Either mention the bot directly, or turn off privacy mode through BotFather
> (`/setprivacy`) so it can see all group messages.

> [accordion] Someone else messaged my bot
>
> Anyone who knows the bot's username can start a chat with it. Unpaired users are not
> treated as you — complete pairing so your agent only acts on your behalf for your own
> account.

> [accordion] "An administrator must configure the Telegram bot first"
>
> The instance-wide deployment configuration has not been saved, or you reached the
> pairing panel before it was. Open **Admin → Configuration**, fill in all four fields of
> the **Telegram deployment configuration** card, and save.

> [accordion] Activation fails after saving the configuration
>
> Activation registers the webhook with Telegram and fails closed when a value is wrong.
> Check that the bot token is exactly what BotFather issued, the webhook secret uses only
> letters, digits, `_` or `-`, the public webhook URL is the full
> `https://…/webhooks/extensions/telegram/updates` address, and the bot username has no
> leading `@` and ends in `bot`.

> [accordion] I asked the agent to connect Telegram and it said it couldn't
>
> The operator half — the deployment configuration — is deliberately not something the
> agent can do for you; follow the steps above in the web interface. Once the
> configuration is saved, asking the agent does work for your personal half: it installs
> and activates the extension and surfaces the pairing panel so you can link your
> Telegram account.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.