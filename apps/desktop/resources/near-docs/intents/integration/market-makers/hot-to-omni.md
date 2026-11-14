> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Move HOT liquidity to Omni tokens

> Withdraw HOT balances to your own wallet, then deposit them back into NEAR Intents so you can solve Omni asset IDs.

HOT balances for BNB Chain, Polygon, and Avalanche stay on your Intents account. Switching the quoted asset ID does not move them and does not burn them.

Quotes for these tokens now settle the new Omni asset ID (`nep141:….omdep.near`). The balance you hold is the old HOT asset ID (`nep245:v2_1.omni.hot.tg:…`). Those are different tokens, so the old balance cannot fill a quote for the new one. Withdraw the old HOT asset to your wallet, then deposit it back as the new Omni asset.

The legacy HOT asset ID and the Omni asset ID for each token are in [BNB Chain, Polygon, and Avalanche token IDs](https://docs.near-intents.org/changelog/entries/2026-11-09-evm-omni-token-ids.md).

**1. Withdraw the old HOT asset to your wallet**

Withdraw each old HOT balance of the tokens above to your wallet address on that chain.

Withdraw the legacy HOT asset ID. The amount you leave inside Intents stays a HOT balance, and that balance still cannot fill an Omni quote.

**2. Deposit it back as the new Omni asset**

From that wallet, deposit those tokens back into NEAR Intents as the new Omni asset, not the old HOT asset. They are credited to your Intents account as Omni assets, and you can use that balance to start quoting.

Request a quote where `originAsset` and `destinationAsset` are both the new Omni asset ID for that token.

| Field | Value |
| - | - |
| `originAsset` | New Omni asset ID |
| `destinationAsset` | Same new Omni asset ID |
| `depositType` | `ORIGIN_CHAIN` |
| `recipient` | Your solver account (`your-solver.near`) |
| `recipientType` | `INTENTS` |
| `refundTo` | The wallet that received the withdrawal |
| `refundType` | `ORIGIN_CHAIN` |
| `amount` | What you are depositing, in the token's smallest unit |

Send `amountIn` from the quote to its `depositAddress`. The request shape is the [origin-chain quote](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request.md).

* **Deposit the new Omni asset ID, not the old HOT asset ID.** Depositing the old ID credits the HOT balance again, and that balance still cannot fill an Omni quote.

After both steps, the Omni assets are on your Intents account. Check the balance with [`mt_balance_of`](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/balances) or on [near.com](https://near.com) before you quote that ID.

> [card] [Token IDs](https://docs.near-intents.org/changelog/entries/2026-11-09-evm-omni-token-ids.md)
>
> Legacy HOT asset IDs and the Omni asset IDs that replace them.

> [card] [Balances and Token IDs](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/balances.md)
>
> Read the Omni balance on your solver account after the deposit.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.