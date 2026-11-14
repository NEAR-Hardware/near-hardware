> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Moving solver liquidity into Confidential Intents

> Move balances from intents.near into intents.far with the 1Click API or near.com

How to move balances from `intents.near` (public) into `intents.far` (confidential), using either the 1Click API or [near.com](https://near.com). Both routes end the same way: the amount is credited to your account id on `intents.far` as an `imt:` balance, ready to quote against on the private relay.

***

## How a shield works

Tokens enter `intents.far` in exactly one way. A transfer on `intents.near` moves them to the Treasury account `51e8f94d77b5e90dc9852ca6113771e11e8382ce69473a75e313e41665de7cbe` with a memo naming the recipient. The Private PoA Bridge sees that transfer and mints the same amount on `intents.far` as `imt:<treasury>:<public id>` (for example `imt:51e8f94d…7cbe:nep141:wrap.near`) to the recipient. Moving back is the reverse: an `imt_burn` on `intents.far` with a memo naming the NEAR recipient, and the Treasury releases on `intents.near`.

> [!NOTE]
>
> You never call the bridge yourself. 1Click and near.com both drive it for you. Your NEAR account id and signing key are the same on both contracts.

***

## Before you start

* Your Partner JWT from [partners.near-intents.org](https://partners.near-intents.org). 1Click accepts it as `X-API-Key`.
* Your solver's NEAR account. Shield to the account that signs your quotes; the confidential balance is credited to whatever account you name as the recipient.
* Your inventory sitting inside `intents.near` under that account. If it is still on another chain, see [From an origin chain](#from-an-origin-chain).

***

> [tab] 1Click API
>
> Scriptable. Use this for the migration and for any later rebalancing.
>
> A shield is a 1Click swap of an asset into itself with the output routed to Confidential Intents. 1Click runs it without a counterparty, so `slippageTolerance: 0` is safe. Three calls per asset.
>
> **1. Quote**
>
> `depositType: INTENTS` funds the swap from your `intents.near` balance. `recipientType: CONFIDENTIAL_INTENTS` credits the output to your account on `intents.far`. `recipient` and `refundTo` are both your solver account id.
>
> Run once with `"dry": true` and compare `quote.amountOut` to `amount` so you see any fee before committing.
>
> ```bash theme={null}
> curl -s https://1click.chaindefuser.com/v0/quote \
>   -H "Content-Type: application/json" \
>   -H "X-API-Key: $PARTNER_JWT" \
>   -d '{
>     "dry": false,
>     "swapType": "EXACT_INPUT",
>     "slippageTolerance": 0,
>     "originAsset": "nep141:wrap.near",
>     "destinationAsset": "nep141:wrap.near",
>     "amount": "1000000000000000000000000",
>     "depositType": "INTENTS",
>     "recipientType": "CONFIDENTIAL_INTENTS",
>     "refundType": "INTENTS",
>     "recipient": "your-solver.near",
>     "refundTo": "your-solver.near",
>     "deadline": "2026-11-12T12:00:00.000Z"
>   }'
> ```
>
> Keep `quote.depositAddress` from the response. For this deposit type it is an account id on `intents.near`.
>
> **2. Generate and sign the funding intent**
>
> 1Click builds the exact NEP-413 payload to sign so the transfer to `depositAddress` is attributed to your quote.
>
> ```bash theme={null}
> curl -s https://1click.chaindefuser.com/v0/generate-intent \
>   -H "Content-Type: application/json" \
>   -H "X-API-Key: $PARTNER_JWT" \
>   -d '{
>     "type": "swap_transfer",
>     "standard": "nep413",
>     "signerId": "your-solver.near",
>     "depositAddress": "<quote.depositAddress>"
>   }'
> ```
>
> The response `intent` is a NEP-413 payload (`message`, `nonce`, `recipient`). Sign it with your solver's NEAR key as-is. The nonce is bound to the quote; do not alter the payload.
>
> See [Signed Intent Execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution.md) for the generate and submit contract, and [Signing Intents](https://docs.near-intents.org/integration/verifier-contract/signing-intents.md) for the payload shape.
>
> **3. Submit**
>
> ```bash theme={null}
> curl -s https://1click.chaindefuser.com/v0/submit-intent \
>   -H "Content-Type: application/json" \
>   -H "X-API-Key: $PARTNER_JWT" \
>   -d '{
>     "type": "swap_transfer",
>     "signedData": {
>       "standard": "nep413",
>       "payload": { "...": "the generated intent" },
>       "public_key": "ed25519:...",
>       "signature": "ed25519:..."
>     }
>   }'
> ```
>
> Paste the generated `intent` payload into `signedData` unchanged, then add `public_key` and `signature` from your solver key.
>
> Poll `GET https://1click.chaindefuser.com/v0/status?depositAddress=<depositAddress>` until `status` is `SUCCESS`. `swapDetails.nearTxHashes` carries the shield transaction on `intents.near`; the mint on `intents.far` has no public hash.
>
> Repeat per asset. The [example solver](https://github.com/hairy-pointer/near-intents-amm-solver/tree/feat/confidential-amm-solver-mode) does exactly this and exposes it as `npm run one-click:deposit-confidential`.
>
> ### From an origin chain
>
> If the tokens are not yet inside `intents.near`, skip the intermediate deposit: quote with `depositType: ORIGIN_CHAIN` and `recipientType: CONFIDENTIAL_INTENTS`. 1Click returns a chain deposit address; send the tokens there and the output is minted confidentially to `recipient` in one hop. No generate-intent or submit-intent needed.
>
> ### Moving back (unshield)
>
> Same three calls with the types reversed: `depositType: CONFIDENTIAL_INTENTS`, `recipientType: INTENTS`, `refundType: CONFIDENTIAL_INTENTS`, same asset in and out. generate-intent returns an `intents.far` transfer for you to sign, and the output lands in your `intents.near` balance. The example solver exposes this as `npm run one-click:withdraw-confidential`.

> [tab] near.com
>
> Manual, no code. Suited to a one-time migration or to solvers whose signing account lives in a wallet.
>
> near.com keeps two balances per account: **Main** (on `intents.near`) and **Confidential** (on `intents.far`). Moving between them is a single transfer.
>
> **1. Sign in**
>
> Sign in at [near.com](https://near.com) with the wallet that controls your solver's NEAR account. The confidential balance is credited to the signed-in account id, so this must be the same account your solver signs quotes with.
>
> **2. Deposit if needed**
>
> If the tokens are not yet on your Main balance, deposit them from the wallet or from another chain.
>
> **3. Transfer Main to Confidential**
>
> Open Transfer and choose **Main to Confidential**. Pick the asset and amount, confirm.
>
> **4. Confirm the credit**
>
> Switch to Confidential Mode in the sidebar to see the credited balance.
>
> To move back, Transfer **Confidential to Main**.

***

## Verifying the balance

Confidential balances are read through 1Click with a User-Session token. There is no public RPC for `intents.far`, so `mt_batch_balance_of` will not work.

**1. Sign an empty intent**

Sign an empty NEP-413 payload with your solver key: signer your account, deadline about 60 seconds out, nonce from `VersionedNonceBuilder.createTimestampedNonceBytes(now)` in `@defuse-protocol/intents-sdk`. No intents.

**2. Authenticate**

```bash theme={null}
curl -s https://1click.chaindefuser.com/v0/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "signedData": {
      "standard": "nep413",
      "payload": { "...": "the signed empty intent" },
      "public_key": "ed25519:...",
      "signature": "ed25519:..."
    }
  }'
```

The response carries `accessToken` and `expiresIn`. See [Authenticate User with Signed Data](https://docs.near-intents.org/api-reference/user-auth/authenticate-user-with-signed-data.md) for the full payload per wallet, and [Authenticating end users](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication.md#authenticating-end-users-confidential-intents) for how the token is used.

**3. Read balances**

```bash theme={null}
curl -s https://1click.chaindefuser.com/v0/account/balances \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Entries with `"source": "private"` are your `intents.far` balances, reported under the public token id with the `imt:` prefix stripped.

***

## Next steps

> [card] [Confidential Intents](https://docs.near-intents.org/integration/market-makers/confidential-intents.md)
>
> Architecture, private relay, and the solver response format

> [card] [Confidential Example](https://docs.near-intents.org/integration/market-makers/confidential-example.md)
>
> Wire quoting, nonces, and balance queries into the example solver


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.