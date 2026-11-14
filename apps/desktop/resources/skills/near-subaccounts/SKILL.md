---
name: near-subaccounts
description: Create NEAR sub-accounts like counter.alice.testnet or watch.alice.near under the user's account, with full access or limited to one contract - for deploying contracts, for agents and scripts that should only do one thing, and for boards that sign with their own key.
---

# Sub-accounts with limited access

Any NEAR account can create accounts under its own name: `alice.near` can create `watch.alice.near`, which can create `ui.watch.alice.near`. A sub-account is a separate account with its own balance and keys; the parent only creates and funds it.

What an account can do depends on its **keys**:

- A **full-access key** can do anything: send NEAR, deploy contracts, add keys, delete the account.
- A **limited key** (NEAR calls it a function-call key) can only **call one contract**, optionally only some of its **methods**, and can spend at most an **allowance** of NEAR on gas fees. It can't send NEAR, attach deposits or deploy. NEAR enforces this; nobody can lift the limit without a full-access key.

That makes limited sub-accounts the safe way to let software act on NEAR: an agent, a script or a board gets exactly one job and a fee budget.

## Create one

Always through `near_create_subaccount`; the user approves the creation (a native prompt that shows the limits). Read `near-accounts` first for the basics.

**Full access, key kept by NEAR Hardware** - for an account that will hold a contract:

```
near_create_subaccount { "network": "testnet", "name": "counter", "initialBalance": "2" }
→ counter.<primary>.testnet; deploy to it with near_deploy_contract
```

**Limited, key kept by NEAR Hardware** - for an agent or script that should only call one contract. After creating it, sign with it via `signerId`; its calls go through **without asking the user**:

```
near_create_subaccount { "name": "bot", "access": "limited",
  "contractId": "counter.alice.testnet", "methodNames": ["increment"], "allowance": "0.25" }
near_call { "signerId": "bot.alice.testnet", "contractId": "counter.alice.testnet", "method": "increment" }
```

**Limited, key held by a board** - the board generates an ed25519 key on the chip and prints its public key; NEAR Hardware never sees the private key (see `near-devices`):

```
near_create_subaccount { "name": "watch", "access": "limited",
  "contractId": "counter.alice.testnet", "methodNames": ["increment"],
  "publicKey": "<the ed25519:… key the board printed>" }
```

Keys held elsewhere can only get **limited** access; the tool refuses full access for them.

To give an **existing** account's power to another key (e.g. a board that already has an account), use `near_add_limited_key` with the same limits.

## Choosing values

- **name**: lowercase letters, digits, `-` and `_`; the full ID must be 64 characters or fewer. Pass just the new part (`"counter"`) or the full ID.
- **parentId**: defaults to the network's primary account. It must be one of the user's full-access accounts in NEAR Hardware.
- **initialBalance**: moves from the parent. `"0.1"` covers an account and its key. A contract needs storage: about **1 NEAR per 100 KB** of wasm plus its data, so give a contract account `"2"`-`"5"` on testnet.
- **methodNames**: list them when you can; omit to allow any method on that contract.
- **allowance**: NEAR for gas fees, default `"0.25"` (hundreds of ordinary calls). When it runs out the key stops working until a full-access key adds a new one. `null` means no cap; avoid it on mainnet.

## Check it

```
near_account_info { "accountId": "watch.alice.testnet" }
```

shows the account's keys and their limits, so you can confirm the board or bot can do exactly what you intended. Sub-accounts the app holds keys for also appear in `near_accounts` with their `access` and `parent`, and in the app's NEAR accounts page.

## Patterns

- **Contract per project**: `counter.alice.testnet` (full access) holds the contract; the user's main account stays clean.
- **Agent budget**: a limited `bot.alice.testnet` that may only call your contract's `record_*` methods; the agent can run unattended.
- **Board identity**: a limited `watch.alice.near` with the board's own key, allowed to call one method like `report_reading`; if the board is stolen, the thief can only call that method until the allowance runs out.
