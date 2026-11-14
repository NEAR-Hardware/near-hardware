> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Security

> IronClaw's defense-in-depth security architecture

IronClaw is built from the ground up with security as a core principle. We use a defense-in-depth architecture with multiple independent layers of protection to keep your data safe while enabling powerful agent capabilities.

> [card] Encrypted at rest
>
> Secrets rest encrypted, and are injected at the host boundary only for approved endpoints.

> [card] Sandboxed execution
>
> Tool run in containers, are resource limited and can only contact allowlisted endpoints.

> [card] Leak Detection
>
> Outbound traffic is scanned in real time. Secret-like data is blocked before exfiltration.

> [card] Network Allowlisting
>
> Tools can reach only pre-approved endpoints. No silent phone-home to unknown hosts.

***

## Data Flow

The security architecture illustrates IronClaw's **defense in depth** approach with four independent protection layers that data flows through before reaching the LLM and external services.

![Data Flow Diagram](https://mintcdn.com/nearai/NSxmiOgiX7EVttKv/images/security/data-flow.png?fit=max\&auto=format\&n=NSxmiOgiX7EVttKv\&q=85\&s=481e2fc3972f111cb29a97532888ab62)

At all point, secrets are separated from regular data and handled with extra care. They are encrypted at rest, never enter the container, and are injected into outgoing requests at the network proxy layer.

***

## Prompt Injection Defense

Multiple layers protect against prompt injection:

1. **Input validation** — Length, encoding, forbidden patterns
2. **Sanitizer** — Escapes dangerous content
3. **Policy engine** — Severity-based actions
4. **Leak detector** — Scans for 15+ secret patterns
5. **Tool output wrapping** — XML format with escape hints

***

## Leak Detector

IronClaw scans all input going to the LLM - be that user input or the result of running a tool - for potential leaks of sensitive information.

The leak detector uses a combination of regex patterns and heuristic checks to identify potential secrets:

| Pattern | Example |
| - | - |
| API keys | `sk-...`, `ak-...` |
| Tokens | `ghp_...`, `sess-...` |
| Private keys | `-----BEGIN RSA PRIVATE KEY-----` |
| Connection strings | `postgres://user:pass@...` |
| AWS credentials | `AKIA...` |
| GitHub tokens | `ghp_...` |

***

## Command Injection Detection

Shell commands are checked for injection attempts:

```bash theme={null}
# BLOCKED: Command chaining
cat file; rm -rf /

# BLOCKED: Subshell
echo $(cat /etc/passwd)

# BLOCKED: Path traversal
cat ../../../etc/passwd
```

***

## Credential Management

Tools cannot access secrets directly, instead, they define what keys, oauth tokens, or API credential they need. Then they proceed to create the necessary requests, and the network proxy injects these credentials into outgoing requests without exposing them to the container.

```json theme={null}
  "credentials": {
    "google_oauth_token": {
      "secret_name": "google_oauth_token",
      "location": { "type": "bearer" },
      "host_patterns": ["gmail.googleapis.com"]
    }
  }
```

***

### Limited Network Access

Tools must be explicit about which external services they can contact. This is configured in the `capabilities` section of your agent config:

```json theme={null}
{
  "network": {
    "allowed_hosts": ["api.example.com"]
  },
  "workspace": {
    "allowed_prefixes": ["telegram/"]
  }
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.