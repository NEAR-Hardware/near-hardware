> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# API Reference

> OpenAI-compatible REST API for private, verifiable AI inference on NEAR AI Cloud

The NEAR AI Cloud API is a REST API served from a single base URL. Its documented
OpenAI-compatible inference surfaces work with OpenAI SDKs by pointing them at NEAR AI.

```text theme={"dark"}
https://cloud-api.near.ai/v1
```

## Authentication

Every request is authenticated with a bearer token in the `Authorization` header. The API
accepts four token types; for programmatic access you almost always want an **API key**.

| Token | Prefix | Use for |
| - | - | - |
| **API key** | `sk-` | Programmatic access to inference and most endpoints. Create keys in the [Developer Dashboard](https://cloud.near.ai). |
| **Access token** (JWT) | — | Short-lived user session token used by the dashboard. Create via `POST /v1/users/me/access-tokens` with a refresh token. |
| **Refresh token** | `rt_` | Long-lived token from OAuth login. Only valid for `POST /v1/users/me/access-tokens`. |
| **Reporting token** | `rpt-` | Read-only access to the [usage reporting](https://docs.near.ai/cloud/guides/usage-reporting.md) endpoints. Create via `POST /v1/organizations/{org_id}/reporting-tokens`. |

```bash theme={"dark"}
curl https://cloud-api.near.ai/v1/chat/completions \
  -H "Authorization: Bearer $NEAR_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "zai-org/GLM-5.1-FP8",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

Each endpoint page lists which token types it accepts under **Authorizations**.

Every endpoint page has an interactive playground: paste your key, edit the request, and
send it directly from the browser.

> [card] [Chat Completions](https://docs.near.ai/api-reference/chat/create-chat-completion.md)
>
> The primary inference endpoint

> [card] [Models](https://docs.near.ai/api-reference/models/list-models-with-pricing.md)
>
> List models, context windows, and pricing

> [card] [Attestation](https://docs.near.ai/api-reference/attestation/get-attestation-report.md)
>
> Verify the TEE running your requests

> [!NOTE]
>
> `POST /v1/responses` is stateless and supports `store: false` only. Read the
> [Stateless Responses guide](https://docs.near.ai/cloud/guides/stateless-responses.md) before migrating
> an integration that uses conversations, files, response history, or built-in tools.

> [!NOTE]
>
> New to NEAR AI Cloud? Start with the [Quickstart](https://docs.near.ai/cloud/quickstart.md), then see
> [OpenAI Compatibility](https://docs.near.ai/cloud/guides/openai-compatibility.md) for SDK setup details.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.