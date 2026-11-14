---
name: near-accounts
description: Use the user's NEAR accounts (testnet and mainnet) from NEAR Hardware while building - check balances, send NEAR, call and view contracts. Read before any task that touches NEAR on-chain.
---

# Using the user's NEAR accounts

NEAR Hardware holds the user's NEAR accounts. Their keys are encrypted in the macOS Keychain and **never reach you**: you ask the app to sign through the `near-hardware` MCP tools, the user approves in the app, and the app sends the transaction. You never need, and must never ask for, a recovery phrase or private key.

## Start here

1. Call `near_accounts`. It returns each network's **primary** account (the default signer for every tool), all other accounts with their limits, balances, and the current approval rules.
2. No account on the network you need? Ask the user to add one: **NEAR accounts** at the bottom of the app's sidebar → **+**. Testnet accounts are free and take one click (they come with 10 test NEAR). Mainnet accounts are imported from a wallet like Meteor.
3. Work on **testnet** unless the user explicitly asks for mainnet. Every tool defaults to `network: "testnet"`.

## Tools

| Tool                     | What it does                                                        | Approval |
| ------------------------ | ------------------------------------------------------------------- | -------- |
| `near_accounts`          | The user's accounts, primary per network, balances, limits, avatars | none     |
| `near_account_info`      | Any account: exists, balance, contract deployed, access keys        | none     |
| `near_view`              | Call a contract's view method                                       | none     |
| `near_transfer`          | Send NEAR from one of the user's accounts                           | yes*     |
| `near_call`              | Call a contract's change method as one of the user's accounts       | yes*     |
| `near_deploy_contract`   | Deploy a `.wasm` from the project to one of the user's accounts     | yes*     |
| `near_create_subaccount` | Create `name.<account>` with full or limited access                 | yes*     |
| `near_add_limited_key`   | Let another key call one contract for an account                    | yes*     |

\* **Approval rules.** Mainnet: the user approves every transaction in a native prompt. Testnet: the user approves each one unless they turned asking off. Accounts whose key is **limited** to one contract never ask: NEAR itself stops them from doing anything else. `near_accounts` tells you the current rules.

If the user denies a transaction the tool fails with "The user denied this transaction". Don't retry it: ask what they'd like instead.

## Conventions

- **Amounts** are NEAR as decimal strings: `"0.5"`, `"0.001"`. Never yoctoNEAR.
- **Gas** is in teragas (`gasTgas`), default 30, max 300. Raise it only when a call fails with "Exceeded the prepaid gas".
- **Deposits**: many contracts need a small attached deposit for storage (e.g. `"0.01"`) on calls that store data; NEP-141 token transfers need exactly `"0.000000000000000000000001"` (1 yoctoNEAR).
- **Results** include `transaction` (hash) and `explorer` (a NearBlocks link). Show the user the link after anything that changed state.
- **Accounts** are names like `alice.testnet` / `alice.near`, or 64-character hex addresses. Sub-accounts look like `counter.alice.testnet`.

## Examples

Check who you are and what you have:

```
near_accounts {}
```

Send test NEAR:

```
near_transfer { "network": "testnet", "to": "bob.testnet", "amount": "0.5" }
```

Read then write a contract:

```
near_view { "contractId": "hello.near-examples.testnet", "method": "get_greeting" }
near_call { "contractId": "hello.near-examples.testnet", "method": "set_greeting",
            "args": { "greeting": "hi from my watch" } }
```

## Failures you'll see

- `NotEnoughBalance`: the signer doesn't have the NEAR. Tell the user how much is needed; on testnet they can create another free account.
- `AccountDoesNotExist` / `doesn't exist`: check the ID with `near_account_info`.
- `RequiresFullAccess` / `MethodNameMismatch` / `ReceiverMismatch`: a limited account tried something outside its limits (see `near-subaccounts`).
- A `failure` in the result with `ok: false`: the transaction ran but the contract panicked; read `failure` and the `logs`.

## Related skills

- `near-subaccounts`: accounts with limited access for agents, contracts and boards.
- `near-contracts`: build a Rust contract and deploy it.
- `near-devices`: put NEAR on a board.
