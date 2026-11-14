> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# 1Click Swap API

> REST API for cross-chain swaps powered by NEAR Intents

1Click Swap is a REST API that automates routing and settlement on NEAR Intents. It requests quotes from [Market Makers](https://docs.near-intents.org/integration/market-makers/introduction.md), constructs the swap, and tracks execution. Assets move to a quote-specific deposit address and settle on-chain; 1Click does not take custody of them.

This REST API abstracts the complexity of intent creation, solver coordination, and transaction execution.

> [!WARNING]
>
> By using the 1Click Swap API, you agree to the [1Click Terms of Service](https://docs.near-intents.org/security-compliance/terms-of-service.md).

***

## Key Benefits

> [card] Simple REST API
>
> Create intents, submit deposits, and track status with a few endpoints.

> [card] Competitive Pricing
>
> Market makers compete on price through automatic solver discovery.

> [card] Built-in Transaction Handling
>
> Includes status tracking, automatic retries, and refund handling.

> [card] Fee Collection
>
> Configure fee collection with a single parameter in your quote requests.

***

## Ready to Dive In?

> [card] [Quickstart Guide](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/introduction.md)
>
> Step-by-step tutorial to make your first swap in under 10 minutes

> [card] [Keys](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication.md)
>
> Learn how to generate API keys and authenticate your requests

> [card] [SDK Libraries](https://docs.near-intents.org/integration/distribution-channels/1click-api/sdk.md)
>
> Explore our SDK libraries for TypeScript, Go, and Rust

> [card] [Fee Configuration](https://docs.near-intents.org/integration/distribution-channels/1click-api/fee-config.md)
>
> Learn how to set up fee collection for your swaps

> [card] [Swap limits](https://docs.near-intents.org/resources/swap-limits.md)
>
> Current minimum swap size by chain

> [card] [Earn](https://docs.near-intents.org/integration/distribution-channels/1click-api/earn.md)
>
> Offer multichain yield through the 1Click Swap API

> [card] [Limit Orders](./orders)
>
> Offer a swap at the user's price through the 1Click Swap API

> [card] [Reusable deposit addresses](https://docs.near-intents.org/integration/distribution-channels/1click-api/reusable-deposit-addresses.md)
>
> Give a user a permanent deposit address they can send to more than once

> [card] [Explorer API](./explorer/introduction)
>
> Programmatic access to historical 1Click Swap transactions

> [card] [Proactive Intents Security](https://docs.near-intents.org/security-compliance/proactive-intents-security.md)
>
> Learn how NEAR Intents proactively manages suspicious fund flows, transaction risk, and security posture across swaps


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.