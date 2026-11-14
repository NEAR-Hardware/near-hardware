> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Fee Configuration

> Configure fee collection and aggregation

Configure how fees are collected and distributed when using the [1Click Swap API](https://docs.near-intents.org/integration/distribution-channels/1click-api/about-1click-api.md). As a distribution channel, you can add your own fees on top of the base platform fees.

> [!TIP]
>
> This guide covers **distribution channel fees** (fees you collect). For an overview of all platform fees including protocol fees and API fees, see [Fees](https://docs.near-intents.org/resources/fees.md).

***

## Fee Parameters

Include these parameters in the `appFees` array when requesting a quote:

| Parameter | Type | Description |
| - | - | - |
| `recipient` | string | Any NEAR-supported address (named account like `alice.near`, implicit account, or EVM-like address) |
| `fee` | number | Integer fee in basis points. `100` = `1.00%`. Charged from the input token. |

`percentage = fee / 10,000` (so `fee: 50` is 0.5%).

Each `fee` must be an integer. After 1Click adds its share, the combined total cannot exceed **500 bps** (5%). A submitted 480 bps without an API key is rejected (480 + 25 = 505).

Public `ANY_INPUT` quotes cannot include `appFees`. Set `appFees` on the user-facing quotes that pay into your aggregation deposit address.

***

## What happens to the fee you send

### API key, no fee of your own: 20 bps to 1Click

Omit `appFees`, or send only `fee: 0`. 1Click charges **20 bps**. USDC, USDT, and DAI pairs, and same-asset transfers across chains, are **1 bp**.

### API key with `appFees`: 50/50 split

Your `fee` is split 50/50 with 1Click. 1Click's **half** has a **20 bps** minimum (1 bp for USDC, USDT, and DAI pairs and same-asset multichain routes). You keep your half. If 1Click's half would be under 20, 1Click still takes 20. That means any `fee` below **40** is charged as your half plus 20.

For example, `"fee": 5` → 3 bps to you (half of 5, rounded up). 1Click's half would be 3, which is under 20, so 20 is added. The swap is charged **23**.

`"fee": 21` is the same pattern: 21 is already above 20, but half of 21 is 11, which is still under 20. You get 11, 1Click takes 20, charged **31**.

`"fee": 40` → 20 bps to you, 20 bps to 1Click. Half meets the minimum, so nothing extra is added.

This split is the default for authenticated partners. Better fee sharing and custom conditions are available: [reach out through the Partner Portal](https://partners.near-intents.org/).

### No API key: your fee plus 25 bps

Without an API key there is no 50/50 split. You keep the full `fee` you submit, and 1Click adds **25 bps** on top. Omit `appFees` or send `fee: 0`, and the swap is still charged 25 bps, all to 1Click.

For example, `"fee": 50` → 50 bps to you and 25 bps to 1Click (**75** charged). `"fee": 5` → 5 to you and 25 to 1Click (**30** charged).

***

## How Fees Are Applied

The formulas below use the **combined** fee in basis points: your share plus 1Click's share, after any split or automatic add.

Fees are calculated differently depending on the swap type:

> [tab] EXACT\_INPUT
>
> For EXACT\_INPUT swaps, the fee is deducted from your input amount before the swap:
>
> 1. `net_in = amount_in * (1 - p)` where `p = fee / 10,000`
> 2. The quote calculates `amount_out` from `net_in`
> 3. `fee_amount = amount_in - net_in` (deducted in input token)
>
> **Example:**
>
> * Input: `amount_in = 1,000,000`, `fee = 100` (1%)
> * Calculation: `net_in = 1,000,000 * (1 - 0.01) = 990,000`
> * User deposits `1,000,000` and quote calculates output from `990,000`
> * Fee: `10,000` units (in input token)

> [tab] EXACT\_OUTPUT
>
> For EXACT\_OUTPUT swaps, the fee increases the required deposit. The API uses ceiling division so the net input still covers the quoted output after the fee is taken:
>
> 1. `gross_in = ceil(required_input × 10,000 / (10,000 - fee_bps))`
> 2. `fee_amount = gross_in - required_input` (deducted in input token)
> 3. If the user deposits more than `gross_in`, fees are deducted from the actual `amount_in`
>
> **Example:**
>
> * Input: `required_input = 500,000`, `fee = 100` (1%)
> * Calculation: `gross_in = ceil(500,000 × 10,000 / 9,900) = 505,051`
> * User must deposit `505,051` to receive the exact output amount
> * Fee: `5,051` units (in input token)

> [tab] FLEX\_INPUT
>
> FLEX\_INPUT is input-side like EXACT\_IN, so the fee is deducted from the input token. Because the deposit amount can vary within the quoted band, the fee is applied to whatever is actually deposited:
>
> 1. `net_in = amount_in * (1 - p)` where `p = fee / 10,000` and `amount_in` is the actual deposit
> 2. The quote calculates `amount_out` from `net_in`
> 3. `fee_amount = amount_in - net_in` (deducted in input token)
>
> **Example** (quote band `0.99–1.00 NEAR`, `fee = 100` / 1%):
>
> * User deposits `amount_in = 1,000,000`
> * Calculation: `net_in = 1,000,000 * (1 - 0.01) = 990,000`
> * Output is calculated from `990,000`
> * Fee: `10,000` units (in input token)
>
> A smaller deposit within the band pays a proportionally smaller fee, since the percentage applies to the actual amount deposited.

> [accordion] Example Quote with Fees
>
> ```json theme={null}
> {
>   "dry": false,
>   "swapType": "EXACT_INPUT",
>   "originAsset": "nep141:wrap.near",
>   "destinationAsset": "nep141:usdt.tether-token.near",
>   "amount": "1000000000000000000000000",
>   "recipient": "user.near",
>   "recipientType": "INTENTS",
>   "refundTo": "user.near",
>   "refundType": "INTENTS",
>   "appFees": [{
>     "recipient": "your-fee-wallet.near",
>     "fee": 50
>   }]
> }
> ```

***

## Fee Aggregation

For high-volume integrations that collect fees in many different tokens, the `ANY_INPUT` swap type aggregates them all into a single destination asset and withdraws automatically.

> [!NOTE]
>
> To compare `ANY_INPUT` with the other swap types, see the [Swap Types](https://docs.near-intents.org/integration/distribution-channels/1click-api/swap-types.md) page.

### How it works

* Deposits in **any supported token** are sent to one dedicated `depositAddress` and accumulate there.
* A background job continuously swaps everything to your chosen `destinationAsset` and withdraws it to `recipient` once the pool reaches **\$1,000 USD**.
* The `deadline` is checked only when the quote is **created** — after that the quote runs **indefinitely**, so a single quote keeps collecting and withdrawing without being refreshed.
* Failed swaps retry every 5 minutes.

> [!WARNING]
>
> **No refunds.** If a swap fails it retries automatically rather than returning funds — set `refundTo` to an address you control as a safety measure.

### Set it up

> [!NOTE]
>
> Every request must include an `Authorization: Bearer YOUR_JWT_TOKEN` header to receive the quote and its `depositAddress`. Get your API key from the [Partner Dashboard](https://partners.near-intents.org/). Public `ANY_INPUT` quote requests cannot contain `appFees`.

**1. Create an ANY\_INPUT quote**

Request a quote with `originAsset: "1cs_v1:any"` and `amount: "0"` to get a dedicated `depositAddress` for fee collection.

> [accordion] Example ANY\_INPUT request
>
> ```json theme={null}
> {
>   "dry": false,
>   "swapType": "ANY_INPUT",
>   "slippageTolerance": 0,
>   "originAsset": "1cs_v1:any",
>   "depositType": "INTENTS",
>   "destinationAsset": "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near",
>   "amount": "0",
>   "refundTo": "your-wallet.near",
>   "refundType": "INTENTS",
>   "recipient": "0x1ddA60d784483FBB54304c68830d42A706327C6d",
>   "recipientType": "DESTINATION_CHAIN",
>   "deadline": "2025-01-01T00:00:00.000Z",
>   "referral": "YOUR_REFERRAL",
>   "quoteWaitingTimeMs": 10000
> }
> ```

| Field | Description |
| - | - |
| `originAsset` | Must be `"1cs_v1:any"` for fee aggregation |
| `destinationAsset` | Token you want to collect fees in |
| `recipient` | Address where converted fees will be withdrawn |
| `recipientType` | `"DESTINATION_CHAIN"` or `"INTENTS"` |
| `refundTo` | Set to an address you control |

> [!TIP]
>
> Set `quoteWaitingTimeMs` to 5000–10000ms for optimal performance (3–4s is often enough).

**2. Wire the deposit address into your fees**

Use the `depositAddress` from the quote response as the `appFees.recipient` in your user quotes (see [Fee Parameters](#fee-parameters)). Collected fees now flow to the aggregation address and convert automatically.

### Track withdrawals

Use the `/v0/any-input/withdrawals` endpoint to retrieve withdrawal records for your deposit address.

**Request:**

```bash theme={null}
GET /v0/any-input/withdrawals?depositAddress=YOUR_DEPOSIT_ADDRESS
```

Records are filtered by `depositAddress` and sorted by `timestamp` (newest first). Page through results with these query parameters:

| Parameter | Description |
| - | - |
| `depositAddress` | **Required.** The deposit address whose withdrawals you're fetching |
| `depositMemo` | Memo, if the deposit address requires one |
| `timestampFrom` | Only return withdrawals from this ISO timestamp onward |
| `page` | Page number (default `1`) |
| `limit` | Records per page (max and default `50`) |
| `sortOrder` | `asc` or `desc` by `timestamp` (default `desc`) |

**Response:**

```json theme={null}
{
  "recipient": "0x88b9da55b59a59751424b357cf8aea239770944c",
  "affiliateRecipient": "2fd5aba4dc4729dcaec040242fc3b0b1faf8c81f74831c7c7843c6a96ad28add",
  "asset": "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
  "withdrawals": [
    {
      "status": "SUCCESS",
      "amountOut": "140735",
      "amountOutFormatted": "0.140735",
      "amountOutUsd": "0.140693483175",
      "withdrawFee": "2400",
      "withdrawFeeFormatted": "0.0024",
      "withdrawFeeUsd": "0.0023992919999999995",
      "timestamp": "2025-10-07T10:16:19.702Z",
      "hash": "0xcc005d3e3340c61b1240905c4e383d8b8ecb114a827bef3e0394293997406621"
    }
  ]
}
```

**Response Fields:**

| Field | Description |
| - | - |
| `recipient` | The `destinationAsset` address these fees are withdrawn to (top-level, applies to all records) |
| `affiliateRecipient` | Internal identifier for this fee-collection deposit address (top-level) |
| `asset` | The `destinationAsset` fees are converted into (top-level) |
| `status` | Withdrawal status (e.g., `SUCCESS`) |
| `amountOut` | Raw amount withdrawn |
| `amountOutFormatted` | Human-readable amount |
| `amountOutUsd` | USD value at time of withdrawal |
| `withdrawFee` | Fee charged for withdrawal, in the smallest unit |
| `withdrawFeeFormatted` | Human-readable withdrawal fee |
| `timestamp` | When the withdrawal occurred |
| `hash` | Transaction hash |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.