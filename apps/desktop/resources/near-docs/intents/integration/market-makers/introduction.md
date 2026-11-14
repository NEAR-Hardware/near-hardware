> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Makers

> Fulfill cross-chain swap intents as a liquidity provider

Market Makers compete to fulfill user [Swap intents](../distribution-channels/introduction). They listen for swap requests on the [Message Bus](https://docs.near-intents.org/integration/market-makers/message-bus/introduction.md), evaluate whether they can fill the request, and respond with signed quotes.

![NEAR Intents Market Makers](https://mintcdn.com/defuselabsltd/OBaHx8_FZb8uK__Y/images/diagrams/market-makers-intro-light.png?fit=max\&auto=format\&n=OBaHx8_FZb8uK__Y\&q=85\&s=2a907b1f71b967cc47d9accbcb049cf7)

***

## How it works

**1. A Quote Request is sent**

A user sends a [quote request](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request.md#request-token) to the [Message Bus](https://docs.near-intents.org/integration/market-makers/message-bus/introduction.md), a WebSocket relay that broadcasts the request to all connected solvers.

**2. Solvers evaluate and quote**

Each solver checks whether they can fulfill the swap. If they can, they compute pricing, and return a signed quote as response.

**3. Quotes compete for selection**

Multiple solvers can respond to the same request with different prices. The Message Bus collects responses and returns the top quotes to the user application.

**4. Selected quote settles on-chain**

After the user chooses a quote, the Message Bus matches the requested intent with the selected quote and submits it to the [Verifier contract](https://docs.near-intents.org/integration/verifier-contract/introduction.md) where the swap settles on-chain.

> [!NOTE]
>
> The NEAR Intents protocol can operate without the Message Bus. Frontends can use other quoting mechanisms, and market makers can index the NEAR blockchain directly to find intents to fill.

***

## Next steps

> [card] [Quickstart](https://docs.near-intents.org/integration/market-makers/quickstart.md)
>
> Set up and run a solver that automatically responds to quote requests

> [card] [Usage Examples](https://docs.near-intents.org/integration/market-makers/example.md)
>
> Understand the code necessary to make a solver respond to quotes

> [card] [Confidential Intents](https://docs.near-intents.org/integration/market-makers/confidential-intents.md)
>
> Solve for private liquidity with shielded balances

> [card] [Message Bus](https://docs.near-intents.org/integration/market-makers/message-bus/introduction.md)
>
> Learn about the Message Bus architecture and how it works


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.