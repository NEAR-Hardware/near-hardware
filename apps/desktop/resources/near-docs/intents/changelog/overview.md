> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Changelog

> What's new in NEAR Intents.

## November 2026

**Nov 11, 2026**

### Bridge API is closing

From November 11, 2026, the Bridge API is closing. Integrate through the 1Click Swap API. A standing deposit address is a reusable deposit address.

> [card] [Bridge API is closing](https://docs.near-intents.org/changelog/entries/2026-11-11-bridge-api.md)
>
> 1Click replaces deposit addresses, token lists, and status on the bridge API. Standing addresses are RDAs.

**Nov 9, 2026**

### BNB Chain, Polygon, and Avalanche token IDs

These tokens now use Omni `nep141` asset IDs. Replace hardcoded legacy HOT `nep245` IDs with the Omni asset ID. Existing HOT balances stay put. Solvers withdraw the old HOT asset to their own wallet and deposit it back as the new Omni asset before quoting.

> [card] [BNB Chain, Polygon, and Avalanche token IDs](https://docs.near-intents.org/changelog/entries/2026-11-09-evm-omni-token-ids.md)
>
> Legacy HOT asset IDs and the Omni asset IDs that replace them.

## October 2026

**Oct 27, 2026**

### 1Click swaps settle confidentially

From October 27, 2026, 1Click swaps settle confidentially. The API is unchanged. As an integrator, you don't need to change anything. Swap data stays on the NEAR Intents Explorer, so this does not mean that 1Click is only Confidential Intents. The swap settles on the NEAR Private Shard, so `nearTxHashes` has no hash for the swap. It has the hashes for the shield and the unshield instead.

> [card] [1Click swaps settle confidentially](https://docs.near-intents.org/changelog/entries/2026-10-27-1click-confidential.md)
>
> No API change. Settlement happens confidentially. `nearTxHashes` has no hash for the swap. It has the shield and unshield hashes instead.

## September 2026

**Sep 18, 2026**

### Robinhood Chain support

NEAR Intents adds Robinhood Chain through the 1Click API. Use `hood` when
you query tokens and request quotes.

> [card] [Robinhood Chain support](https://docs.near-intents.org/changelog/entries/2026-09-18-robinhood-chain.md)
>
> 1Click identifier, currently supported assets on public and confidential routes.

**Sep 14, 2026**

### Temporary \$100 quote minimum on Tron

Origin → origin swaps under \$100 USD are temporarily blocked when the deposit
is on Tron. Deposits to and withdrawals from Intents are not affected.

> [card] [Temporary \$100 quote minimum on Tron](https://docs.near-intents.org/changelog/entries/2026-09-14-temporary-tron-100-minimum.md)
>
> Origin → origin swaps under \$100 USD when the deposit is on Tron. Intents deposits and withdrawals unchanged.

**Sep 9, 2026**

### Temporary \$1,000 quote minimum on nine chains

Origin → origin swaps under \$1,000 USD are temporarily blocked on nine
chains. Deposits to and withdrawals from Intents are not affected.

> [card] [Temporary \$1,000 quote minimum](https://docs.near-intents.org/changelog/entries/2026-09-09-temporary-1000-minimum.md)
>
> Origin → origin swaps under \$1,000 USD on nine chains. Intents deposits and withdrawals unchanged.

## August 2026

**Aug 28, 2026**

### 1Click API: Limit Orders

Wallets and apps can rest a confidential swap at a price the user sets, through
the 1Click Swap API. This is not Perpetuals on near.com.

> [card] [Limit Orders](https://docs.near-intents.org/integration/distribution-channels/1click-api/orders)
>
> Offer a swap at the user's price through the 1Click Swap API.

## July 2026

**Jul 13, 2026**

### Confidential Intents B2B launch

Confidential Intents is live for B2B partners. Confidential swaps execute on a
private chain with shielded balances and settle back to public NEAR through
the Private PoA Bridge.

> [card] [Confidential Intents](https://docs.near-intents.org/integration/market-makers/confidential-intents.md)
>
> Two-chain architecture, shield and unshield flows, versioned nonces, and the solver response format.

### Changelog on the docs website

This changelog is now part of the docs site. New features, API changes, and
launches land here as dated entries.

> [card] [Changelog](https://docs.near-intents.org/changelog/overview.md)
>
> Bookmark this page to track what's new in NEAR Intents.

### WebSocket-only whitelisted solvers on Confidential Intents

Solver access on the confidential relay is now gated by an allowlist.
Whitelisted solvers connect over WebSocket only, subscribing to relay streams
and responding with signed quotes; solvers not on the list are denied entirely.

> [card] [Private Relay](https://docs.near-intents.org/integration/market-makers/confidential-intents.md#private-relay)
>
> Whitelisted solvers receive quote requests and respond via `quote_response` over `/ws`. Contact the Defuse team to get whitelisted.

### FE (near.com): Limit Orders on Perpetuals

Perpetuals on near.com now support limit orders. Set your price and the order
fills when the market reaches it.

> [card] [Trade Perps on NEAR](https://near.com/perps)
>
> Place limit orders on the Perpetuals interface at near.com.

**Jul 3, 2026**

### Shield Incident API

A partner-facing API to pull active Shield incidents and submit new ones. Use
`GET`/`POST https://shield.chaindefuser.com/incident` with a `SHIELD` API key.

> [card] [Shield Incident API guide](https://docs.near-intents.org/security-compliance/shield-incident-api.md)
>
> Endpoints, request and response shapes, scope fields, and how to get a token.

**Jul 1, 2026**

### Confidentiality parameter

Quote requests now accept a `confidentiality` field that makes a normal quote a
confidential swap.

> [card] [Confidentiality parameter](https://docs.near-intents.org/changelog/entries/2026-07-02-confidentiality-parameter.md)
>
> What changed, the two integration paths, and an example request.

## June 2026

**Jun 27, 2026**

### Verify Quote Signatures

1Click signs quote payloads so partners can verify the payload origin and detect
tampering before using fields like `depositAddress` in 1click quote response
payloads.

> [card] [Verify Quote Signatures](https://docs.near-intents.org/integration/distribution-channels/1click-api/verify-quote-signature.md)
>
> What is signed, how to verify, and code examples.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.