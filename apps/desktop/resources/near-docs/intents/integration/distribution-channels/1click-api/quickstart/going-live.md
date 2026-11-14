> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Going Live

> Next steps and troubleshooting for your first 1Click integration

## Next steps

> [card] [Clone the Example Repo](https://github.com/near-examples/near-intents-examples)
>
> Clone and run a working TypeScript implementation to get started quickly.

> [card] [Watch NEAR Intents 102](https://www.youtube.com/watch?v=U8ngm2hR4a4)
>
> Follow along with this guided workshop explaining all the steps in detail.

> [card] [Use the SDK](https://docs.near-intents.org/integration/distribution-channels/1click-api/sdk.md)
>
> Integrate with our official SDK libraries for TypeScript, Go, or Rust.

> [card] [NEAR Intents Explorer](https://explorer.near-intents.org)
>
> Track transactions and view swap history

> [card] [Earn](https://docs.near-intents.org/integration/distribution-channels/1click-api/earn.md)
>
> Route the same quote flow into a yield vault. Destination is the receipt token.

## Troubleshooting

> [accordion] Swap taking a long time
>
> * Check the blockchain explorer for your deposit transaction
> * Verify the deposit address matches the quote response
> * Allow up to 15 minutes for cross-chain processing
> * Use the status endpoint to check current state

> [accordion] Quote rejected: Temporary swap limits
>
> Chain-to-chain quotes under the minimum for that chain are rejected. The current amounts are on [Swap limits](https://docs.near-intents.org/resources/swap-limits.md).

> [accordion] Swap failed or was refunded
>
> * Verify you sent the exact amount specified in the quote
> * Check your refund address for returned funds
> * Ensure your destination address format is correct for the target chain
> * Request a new quote and try again

> [accordion] Need help?
>
> Join our [Telegram community](https://t.me/near_intents) for support.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.