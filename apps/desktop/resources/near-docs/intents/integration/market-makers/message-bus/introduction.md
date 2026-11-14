> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> Off-chain bus communicating market makers and users

The Message Bus is a system component that optimizes price discovery between users and market makers. It handles communication and submits settlement transactions to the Verifier contract.

![Message Bus Architecture](https://mintcdn.com/defuselabsltd/OBaHx8_FZb8uK__Y/images/diagrams/msg-bus-light.png?fit=max\&auto=format\&n=OBaHx8_FZb8uK__Y\&q=85\&s=4a20b2baa19ee16e4fe9ac27cd91e86e)

> [!NOTE]
>
> The protocol can operate without the Message Bus:
>
> * **Frontends** can use any quoting mechanism to compose and publish signed intents
> * **Market makers** can index the NEAR blockchain directly to find intents to fill

***

## How it works

1. **User requests a quote** - A frontend sends a quote request to the Message Bus
2. **Market makers receive the request** - The Message Bus broadcasts the request to all connected solvers via WebSocket
3. **Market makers respond** - Solvers evaluate the trade and respond with signed intents
4. **User accepts a quote** - The frontend displays options to the user, who selects and signs their intent
5. **Settlement** - The Message Bus bundles the matching intents and submits them to the Verifier contract

***

## Next steps

> [card] [API Reference](https://docs.near-intents.org/integration/market-makers/message-bus/rpc.md)
>
> Read the API documentation for the Message Bus

> [card] [WebSocket Reference](https://docs.near-intents.org/integration/market-makers/message-bus/websocket.md)
>
> Subscribe and respond to quote requests in real-time


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.