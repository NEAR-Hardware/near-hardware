> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Staking for Inference

> Stake NEAR and let the staking rewards pay for private inference on NEAR AI Cloud — your principal stays yours and stays withdrawable.

Calling a model today usually means handing a payment method to a cloud provider and letting it meter your usage. Staking for Inference removes that dependency: you stake NEAR, and the staking **rewards** — not the staked NEAR itself — pay for [private inference](https://docs.near.ai/cloud/private-inference.md) on NEAR AI Cloud. You keep the NEAR. Unstake, and the credits stop.

***

## How it works

Confidential inference converts the yield your stake earns, rather than the stake itself, into compute credits. Your monthly budget is a function of three things:

* **How much NEAR you stake**
* **The price of NEAR**
* **The current staking APY** — the same yield your stake would earn anyway, redirected into compute

Credits accrue continuously, on a per-second basis, as a function of your stake size — there's no waiting for a monthly refresh. One credit is worth one US dollar of usage on NEAR AI Cloud, the same unit your bill is already denominated in; unused credits carry forward.

> [!NOTE]
>
> Because the reward rate is network-wide, not a fixed setting, your covered usage drifts with both the NEAR price and how much of the total supply is staked. Try the [staking calculator](https://docs.near.ai/cloud/staking-for-inference/calculator.md) to see current numbers.

### Why the reward rate moves

NEAR issues a fixed amount of new token each year and splits it among everyone staking. Your share of that depends on how much of the supply is staked network-wide: when less is staked, the same rewards divide among fewer tokens and the rate rises; when more is staked, it falls. Validator commission, typically 1–10%, comes out of that yield before it reaches you.

***

## What you keep

Two things follow from paying with staking yield instead of a metered card:

> [card] Principal stays yours
>
> Staked NEAR remains withdrawable. You retain ownership of the underlying stake the entire time it's generating credits — running inference is a recoverable position, not a sunk bill.

> [card] Reversible, any time
>
> Unstake and you walk away with your original NEAR intact. The credit allowance simply stops accruing — nothing is spent or forfeited.

***

## Confidentiality guarantees

Staking for Inference pays for the same private inference NEAR AI Cloud always provides — it doesn't change the privacy model, only how you pay for it.

* **Open-source models** (Qwen, DeepSeek, GLM) run inside a [Trusted Execution Environment](https://docs.near.ai/cloud/private-inference.md) — a hardware-isolated enclave on the GPU. Your prompt and the model's output are sealed off from the host operating system, the GPU operator, and NEAR AI itself. Each request returns a hardware-signed attestation in under 30 seconds, so this is a guarantee you can check, not a promise you have to trust.
* **Frontier models** (from providers like Anthropic, OpenAI, and Google) route through a secure gateway that itself runs inside a TEE. The provider sees a prompt arrive from the gateway and nothing else — it cannot tie the request back to you. An optional PII redaction step strips identifying details before the request leaves the enclave.

***

## Managing your stake

The entire lifecycle lives in your NEAR wallet. Stake more for a larger credit budget, or unstake to reclaim your NEAR — every change is a signed wallet transaction, with no separate account or credit card involved.

## Next steps

> [card] [Staking Calculator](https://docs.near.ai/cloud/staking-for-inference/calculator.md)
>
> Work out how much NEAR to stake for your usage, or what a given stake gets you.

> [card] [Private Inference](https://docs.near.ai/cloud/private-inference.md)
>
> See how NEAR AI Cloud's TEE architecture protects your data end to end.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.