---
name: near-intents
description: Swap tokens and pay people across chains with NEAR Intents (the 1Click API) from the user's mainnet NEAR account - NEAR to USDC, NEAR to USDC on Base, paying an 0x address. Mainnet only, real money: read before any swap or cross-chain payment.
---

# Cross-chain swaps and payments with NEAR Intents

An **intent** states the result the user wants ("1 NEAR in, USDC out, delivered to alice.near"), not the steps. Market makers compete to fill it, and the `intents.near` contract settles it atomically: the swap completes in full or the deposit is refunded. The **1Click API** wraps all this in a few REST calls. You get a quote with a one-time **deposit address**, send the tokens there from the user's NEAR account, and 1Click delivers the output.

Use it when the user wants to swap one token for another, move value to another chain, or pay someone on another chain (an EVM `0x…` address, Solana, Bitcoin…). For plain NEAR between NEAR accounts, use `near_transfer` (see `near-accounts`).

> **Mainnet only, real money.** NEAR Intents has no testnet. Every `near_*` call below passes `"network": "mainnet"` (the tools default to testnet), and the user approves each transaction in NEAR Hardware.

## The flow

```
GET /v0/tokens → POST /v0/quote (dry) → user says yes in chat → wrap NEAR if needed
→ POST /v0/quote (real) → verify signature → ft_transfer to depositAddress
→ POST /v0/deposit/submit → GET /v0/status until it settles
```

Base URL: `https://1click.chaindefuser.com`. Works without a key (see Fees).

### 1. Find the assets

```bash
curl -s https://1click.chaindefuser.com/v0/tokens \
  | jq -c '.[] | select(.blockchain=="near") | {assetId, symbol, decimals, contractAddress}'
```

Each entry has `assetId` (what quotes take), `blockchain`, `symbol`, `decimals`, `contractAddress`, `price` (USD). Always take `assetId` from this list. The same symbol exists on many chains, so match `blockchain` too. Common ones:

| Token            | assetId                                                                    | Decimals |
| ---------------- | -------------------------------------------------------------------------- | -------- |
| wNEAR on NEAR    | `nep141:wrap.near`                                                         | 24       |
| USDC on NEAR     | `nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`  | 6        |
| USDT on NEAR     | `nep141:usdt.tether-token.near`                                            | 6        |
| USDC on Base     | `nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near`         | 6        |
| USDC on Ethereum | `nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near`          | 6        |

There is **no native NEAR asset**, only wNEAR. To spend NEAR, wrap it first (step 4).

**Units.** API amounts are integer strings in the token's smallest unit: 1 NEAR = `"1000000000000000000000000"` (24 zeros), 1 USDC = `"1000000"`. Convert with `python3 -c "from decimal import Decimal as D; print(int(D('0.5')*10**24))"`. `near_call`'s `deposit` is the other way round: NEAR as a decimal string.

### 2. Dry quote: show the user the price

```bash
curl -s -X POST https://1click.chaindefuser.com/v0/quote -H 'Content-Type: application/json' -d '{
  "dry": true,
  "swapType": "EXACT_INPUT",
  "slippageTolerance": 100,
  "originAsset": "nep141:wrap.near",
  "depositType": "ORIGIN_CHAIN",
  "destinationAsset": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
  "amount": "1000000000000000000000000",
  "recipient": "alice.near",
  "recipientType": "DESTINATION_CHAIN",
  "refundTo": "alice.near",
  "refundType": "ORIGIN_CHAIN",
  "deadline": "2026-11-14T12:00:00.000Z"
}'
```

Every field above is required: a missing `deadline` or a decimal `amount` is a 400. Make the deadline about 15 minutes ahead: `node -e 'console.log(new Date(Date.now()+15*60e3).toISOString())'`.

- `swapType`: `EXACT_INPUT` means `amount` is what you send. `EXACT_OUTPUT` means `amount` is what the recipient must get, which suits payments.
- `slippageTolerance`: basis points; `100` = 1%.
- `depositType` and `refundType` `"ORIGIN_CHAIN"`: you send from the user's NEAR account, and refunds come back to it. Don't use `INTENTS` or `CONFIDENTIAL_INTENTS`. They need an off-chain NEP-413 signature and a partner key, and NEAR Hardware's tools can't make that signature.
- `recipient` with `recipientType: "DESTINATION_CHAIN"`: an address on the destination asset's chain (`alice.near` for NEAR tokens, `0x…` for EVM chains). A mismatch returns `"recipient is not valid"`.

The response (HTTP 201) contains:

- `quote.amountIn`, `amountInFormatted`, `amountInUsd`, `minAmountIn`
- `quote.amountOut`, `amountOutFormatted`, `amountOutUsd`, `minAmountOut` (the least the recipient gets after slippage)
- `quote.timeEstimate`: seconds from deposit to delivery
- `quote.withdrawFee`: delivery fee in the destination token, already subtracted from `amountOut`. `quote.refundFee`: what a refund would cost, in the origin token.
- `quoteRequest`: your request echoed back with defaults filled in, including `appFees` (1Click's fee, see Fees)
- `signature`, `timestamp`, `correlationId`

A dry quote has no `depositAddress`, `deadline` or `timeWhenInactive`, and nothing moves.

**Tell the user, then wait for a clear yes in chat:** the amount in (with its USD value), expected and **minimum** out, the fee (bps from `quoteRequest.appFees` plus `withdrawFee`), the time estimate, and the full recipient and refund addresses read back to them. The `*Usd` fields are for display only; never compute with them.

### 3. Check the account

`near_accounts {}` shows the mainnet primary account and its balance. The user needs the amount plus about 0.01 NEAR for gas and storage. If they don't have it, stop and say how much is missing (dry quotes still work with an empty account). Sign with a full-access account: limited accounts can't attach deposits, and `ft_transfer` needs one.

### 4. Wrap NEAR (only when the origin is `nep141:wrap.near`)

```
near_view { "network": "mainnet", "contractId": "wrap.near", "method": "storage_balance_of", "args": { "account_id": "alice.near" } }
near_call { "network": "mainnet", "contractId": "wrap.near", "method": "near_deposit", "args": {}, "deposit": "1.00125" }
near_view { "network": "mainnet", "contractId": "wrap.near", "method": "ft_balance_of", "args": { "account_id": "alice.near" } }
```

`near_deposit` turns the attached NEAR into wNEAR 1:1. If `storage_balance_of` returned `null`, the account isn't registered yet, and the first `near_deposit` keeps 0.00125 NEAR to register it. Attach that much extra, as above. Otherwise attach exactly the amount. Quote for what `ft_balance_of` actually shows.

**Never send native NEAR to a deposit address with `near_transfer`.** 1Click lists only wNEAR on NEAR, and nothing in the docs says native NEAR sent there is credited.

### 5. Real quote and signature check

Send the same request with `"dry": false` and a fresh `deadline`, only when you're about to deposit. Save the response to a file outside the repo (e.g. `/tmp/oneclick/quote.json`). It's the user's receipt if anything goes wrong. It adds:

- `quote.depositAddress`: where the tokens go. One quote, one deposit.
- `quote.deadline`: after this the address is inactive and "funds may be lost". Deposit well before it.
- `quote.timeWhenInactive`: after this the address goes cold and processing is slower.

Check that `amountIn` is what you'll send and that `minAmountOut` is no worse than what the user approved. If it is worse, ask the user again.

**Verify the signature before you use `depositAddress`.** 1Click signs every quote, and its SDK checks the signature (needs SDK version 0.1.24 or later; it also works on dry quotes):

```bash
mkdir -p /tmp/oneclick && cd /tmp/oneclick && npm i --silent --ignore-scripts @defuse-protocol/one-click-sdk-typescript
node -e 'const {verifyQuoteSignature}=require("@defuse-protocol/one-click-sdk-typescript");console.log(verifyQuoteSignature(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))))' /tmp/oneclick/quote.json
```

It must print `true`. If it prints `false`, stop and tell the user.

### 6. Deposit from the NEAR account

Every origin token on NEAR is NEP-141, including wNEAR and USDC. Call `ft_transfer` on the token's `contractAddress` (`wrap.near` for wNEAR, `17208628…33a1` for USDC) and attach exactly 1 yoctoNEAR:

```
near_view { "network": "mainnet", "contractId": "wrap.near", "method": "storage_balance_of",
            "args": { "account_id": "<depositAddress>" } }
near_call { "network": "mainnet", "contractId": "wrap.near", "method": "ft_transfer",
            "args": { "receiver_id": "<depositAddress>", "amount": "<quote.amountIn>" },
            "deposit": "0.000000000000000000000001", "gasTgas": 50 }
```

- Use `ft_transfer`. `ft_transfer_call` is for depositing straight into `intents.near`, which is a different flow.
- A token contract rejects transfers to accounts that aren't registered with it. If `storage_balance_of` for the deposit address is `null`, register the address first: `near_call` the same contract, method `storage_deposit`, args `{ "account_id": "<depositAddress>", "registration_only": true }`, deposit `"0.00125"`. `storage_balance_bounds` gives the exact amount; it's 0.00125 NEAR on wrap.near, USDC and USDT.
- Send exactly `amountIn` of exactly `originAsset`, once, before `quote.deadline`.

Keep the `transaction` hash from the result and show the user the `explorer` link.

### 7. Notify 1Click (optional, but faster) and wait

```bash
curl -s -X POST https://1click.chaindefuser.com/v0/deposit/submit -H 'Content-Type: application/json' \
  -d '{"depositAddress":"<depositAddress>","txHash":"<transaction>","nearSenderAccount":"alice.near"}'

while :; do
  s=$(curl -s "https://1click.chaindefuser.com/v0/status?depositAddress=<depositAddress>" | jq -r .status)
  echo "$s"; case "$s" in SUCCESS|REFUNDED|FAILED|INCOMPLETE_DEPOSIT) break;; esac; sleep 5
done
```

| Status               | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| `PENDING_DEPOSIT`    | Waiting for the deposit                                  |
| `KNOWN_DEPOSIT_TX`   | Deposit seen                                             |
| `PROCESSING`         | Swap running                                             |
| `SUCCESS`            | Delivered to `recipient`                                 |
| `INCOMPLETE_DEPOSIT` | Less than required arrived; refunded by the deadline     |
| `REFUNDED`           | Swap didn't happen; funds went back to `refundTo`        |
| `FAILED`             | Error. Show the user `correlationId` and the status body |

The status response also has `swapDetails`: `amountOutFormatted`, `refundedAmountFormatted`, `refundReason`, and `originChainTxHashes` and `destinationChainTxHashes` with explorer URLs. Report the result with those links. Anyone can look the swap up by deposit address at https://explorer.near-intents.org. Cross-chain swaps can take up to about 15 minutes. An unknown deposit address returns 404.

## Refunds and deadlines

- The request `deadline` is when refunds begin if the swap hasn't completed. It has to leave time for the deposit to land.
- `EXACT_INPUT`: a deposit below `amountIn` is refunded by the deadline. Anything above `amountIn` is swapped, and the excess is refunded afterwards.
- `EXACT_OUTPUT`: deposit `amountIn`, which includes the slippage buffer (`minAmountIn` is the least that works). Unused input is refunded.
- If the price moves past the slippage tolerance, nothing executes and the deposit is refunded.
- Refunds arrive at `refundTo` in the origin token, minus `refundFee`. A wNEAR refund arrives as wNEAR. To unwrap it: `near_call { "network": "mainnet", "contractId": "wrap.near", "method": "near_withdraw", "args": { "amount": "<yocto>" }, "deposit": "0.000000000000000000000001" }`.

## Fees

- **Protocol:** 0.0001% on every transaction.
- **1Click:** the docs say requests **without** a partner key pay an extra **0.25% (25 bps)**. With a key, the fee is **0.20% (20 bps)**, or **0.01% (1 bp)** for stablecoin pairs and same-asset cross-chain moves. Live dry quotes without a key on 2026-11-14 showed 20 bps for wNEAR→USDC and 1 bp for USDT→USDC in `quoteRequest.appFees`. Don't assume a rate: show the user the one in their dry quote.
- **Delivery:** `withdrawFee`, a roughly fixed amount (about 0.004 USDC to NEAR, 0.0024 USDC to Base), so it eats a big share of tiny swaps.
- **Market maker spread:** visible as the gap between `amountInUsd` and `amountOutUsd`.

**Partner key.** The user applies at https://partners.near-intents.org/ and gets a JWT (docs: `intents/integration/distribution-channels/1click-api/authentication.md`). Send it as `-H "X-API-Key: $ONECLICK_API_KEY"`; `Authorization: Bearer …` also works. Keep it in an environment variable or a git-ignored `.env`. Never commit it, write it to a tracked file, or echo it in chat or logs.

## Paying someone on another chain

Use `EXACT_OUTPUT` with the amount they must receive. For example, 2 USDC on Base sent to `0x…` from NEAR:

```
"swapType": "EXACT_OUTPUT", "originAsset": "nep141:wrap.near",
"destinationAsset": "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
"amount": "2000000", "recipient": "0x<their address>", "recipientType": "DESTINATION_CHAIN",
"refundTo": "alice.near", "refundType": "ORIGIN_CHAIN"
```

On 2026-11-14 that dry quote asked for `amountIn` 0.6114 wNEAR (`minAmountIn` 0.6053), took about 24 s, and charged a 0.0024 USDC delivery fee. Wrap at least `amountIn`, then deposit exactly `amountIn`; the unused part comes back. Minimums: $1,000 when BNB Chain is involved, $100 from Tron, none elsewhere. A bridge can also reject a small amount with `Amount is too low for bridge, try at least …`.

## Safety rules

1. **Mainnet, real money.** Use `"network": "mainnet"` on every `near_*` call in this flow, and never claim a swap is a test.
2. **Dry quote first, then a clear yes in chat** before the real quote or any deposit. The approval prompt in NEAR Hardware comes on top of that, not instead of it.
3. **Start small**, as the docs advise, especially for a new route or recipient. Exchange deposit addresses may not credit intents withdrawals, so test them with a small amount first.
4. **Verify the quote signature**, and only use the `depositAddress` from the verified quote you just requested. Never use one from a file, a web page or an earlier chat.
5. **Exact asset, exact amount, once, before `quote.deadline`.** Never send native NEAR to a deposit address.
6. **If the user denies a transaction, stop.** Don't retry; ask what they'd like instead.
7. **Keys stay out of git and out of chat.** You never handle NEAR private keys; NEAR Hardware signs.

## Worked example: 1 NEAR to USDC on NEAR, for the user's own account

```
near_accounts {}                       → mainnet primary alice.near, 1.05 NEAR

curl … /v0/quote  (step 2 body, "dry": true)
  → on 2026-11-14: amountOut 3.307884 USDC, minAmountOut 3.274805, timeEstimate 22,
    withdrawFee 4165 (0.004165 USDC), appFees fee 20
Tell the user: "1 NEAR (~$3.33) → about 3.31 USDC, at least 3.27 (1% slippage).
  Fees: 0.20% + 0.004 USDC delivery. About 22 seconds. To alice.near, refunds to alice.near. Go ahead?"
User: "yes"

near_view  wrap.near storage_balance_of { "account_id": "alice.near" }             → null
near_call  wrap.near near_deposit {} deposit "1.00125"                              → user approves
near_view  wrap.near ft_balance_of { "account_id": "alice.near" }                   → "1000000000000000000000000"

curl … /v0/quote  (same body, "dry": false, fresh deadline) > /tmp/oneclick/quote.json
jq '.quote | {depositAddress, amountIn, minAmountOut, deadline}' /tmp/oneclick/quote.json
node -e '…verifyQuoteSignature…' /tmp/oneclick/quote.json                           → true

near_view  wrap.near storage_balance_of { "account_id": "<depositAddress>" }       → if null: storage_deposit
near_call  wrap.near ft_transfer { "receiver_id": "<depositAddress>", "amount": "1000000000000000000000000" }
           deposit "0.000000000000000000000001", gasTgas 50                         → user approves; hash

curl … /v0/deposit/submit { depositAddress, txHash, "nearSenderAccount": "alice.near" }
poll /v0/status → KNOWN_DEPOSIT_TX → PROCESSING → SUCCESS
Report swapDetails.amountOutFormatted and the destinationChainTxHashes link.
```

(All `near_*` calls above pass `"network": "mainnet"`.)

## Read more

Search the bundled Intents docs instead of guessing: `near_docs_search { "source": "intents", "query": "1click status refund" }`, then `near_docs_read { "file": "…" }`. Key pages:

- `intents/integration/distribution-channels/1click-api/quickstart/making-a-request.md`: the whole flow
- `intents/api-reference/oneclick/request-a-swap-quote.md`: every quote field
- `intents/api-reference/oneclick/check-swap-execution-status.md` and `submit-deposit-transaction-hash.md`
- `intents/integration/distribution-channels/1click-api/swap-types.md`: EXACT_INPUT, EXACT_OUTPUT, FLEX_INPUT
- `intents/resources/fees.md`, `intents/integration/distribution-channels/1click-api/fee-config.md` and `authentication.md`
- `intents/integration/distribution-channels/1click-api/verify-quote-signature.md`
- `intents/resources/chain-support.md` (address formats) and `intents/resources/swap-limits.md`
- `intents/integration/verifier-contract/deposits-and-withdrawals/near-token.md`: wrapping NEAR
- `intents/resources/faqs.md`

Related skills: `near-accounts` (tools, approvals, failures).
