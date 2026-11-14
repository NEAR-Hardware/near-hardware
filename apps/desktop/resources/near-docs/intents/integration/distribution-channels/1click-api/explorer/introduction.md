> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Explorer API

> Programmatic access to historical 1Click Swap transactions

The Explorer API provides read-only access to historical 1Click Swap transactions and their statuses, mirroring the data available on the [NEAR Intents Explorer](https://explorer.near-intents.org/).

**Base URL:** `https://explorer.near-intents.org/api/v0`

***

## Overview

This API is designed for distribution channels and analytical services that need to:

* Retrieve historical swap transaction data
* Filter swaps by chains, tokens, timestamps, and status
* Build dashboards and analytics tools
* Monitor swap activity programmatically

> [!NOTE]
>
> The Explorer API is read-only and specifically for 1Click Swap transactions.

## Authentication

Include the token in your requests:

```bash theme={null}
curl -X GET "https://explorer.near-intents.org/api/v0/transactions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

> [!WARNING]
>
> A JWT token is **required** for all requests. Get your token from the [Partner Dashboard](https://partners.near-intents.org/).

***

## Rate Limiting

All API endpoints are rate-limited per partner:

* **1 request every 5 seconds** per partner ID
* Rate limits are enforced based on your JWT token
* Exceeding the limit returns `429 Too Many Requests`

***

## Endpoints

> [card] [Get Transactions](https://docs.near-intents.org/integration/distribution-channels/1click-api/explorer/transactions)
>
> Cursor-based pagination for efficient traversal

***

## API Specification

> [card] [Swagger UI](https://explorer.near-intents.org/api/docs)
>
> Interactive API documentation

> [card] [OpenAPI Spec](https://explorer.near-intents.org/api/v0/openapi.yaml)
>
> Download the YAML specification


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.