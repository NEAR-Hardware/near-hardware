> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# NEAR Intents

> Learn how the intents protocol works

NEAR Intents is a multichain transaction protocol where users specify what they want and let third parties compete to provide the best solution. This works for everything from token swaps to pizza delivery, creating a universal marketplace across crypto and traditional services.

> [accordion] Common use cases
>
> * **One API for cross-chain swaps:** swap tokens across chains through a single integration with the [1Click API](https://docs.near-intents.org).
> * **Move stablecoins between chains programmatically:** send USDC from one chain and receive it on another without building bridge integrations.
> * **Charge for APIs with x402 and get paid on any chain:** the [x402 1Click gateway](https://github.com/IkerAlus/x402_1CS_gateway) accepts x402 payments in USDC on an EVM chain and settles them to a merchant on any chain NEAR Intents supports. It is a pilot that has not been battle-tested.

![NEAR Intents Overview](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/chain-abstraction/intents-overview.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=0f00df672a9f3f4f87a22ed4cf8546a0)

> [card] [Read Intents Docs](https://docs.near-intents.org)
>
> Read the official documentation to learn more about NEAR Intents and how to use it

***

## How It Works

**1. Intent Creation**

A user or AI agent expresses a desired outcome *(ex: Swap Token A for Token B)* and broadcasts the intent to network of Market Makers (also called Solvers).

**2. Market Maker Competition**

An off-chain decentralized network of Market Makers (aka solvers) compete to fulfill the request in the most optimal way. When the network finds the best solution, it presents it as a quote to the originating user/agent for approval.

**3. Intent Execution**

If the quote from the Market Maker is accepted, the intent is executed by calling a "Verifier" smart contract on NEAR Protocol. This contract securely verifies and settles the final transaction.

***

## Resources

> [card] [Official NEAR Intents Documentation](https://docs.near-intents.org)
>
> Read the official documentation to learn more about NEAR Intents.

> [card] [Dev Support Channel](https://t.me/near_intents)
>
> Join the Telegram developer support channel.

> [card] [Integration Example](https://github.com/near-examples/near-intents-examples)
>
> Explore an easy integration example that uses the 1Click API.

> [card] [near-intents.org (Live Site)](https://near-intents.org)
>
> Try the live demo application showcasing token swaps.

> [card] [Independent Fee Benchmark](https://openchainbench.com/benchmarks/bridge-fee)
>
> Compare NEAR Intents against other bridges on effective USDC transfer costs, measured independently across Solana, Base, and Arbitrum corridors.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.