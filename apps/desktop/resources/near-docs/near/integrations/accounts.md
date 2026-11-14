> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Accounts

> Implicit-account derivation, on-chain creation, transfers, key management, and account costs for exchanges.

NEAR supports implicit accounts with 64-character hexadecimal IDs derived locally from an ED25519 public key. An account can be created with no initial deposit; the creator pays a **0.007 NEAR** creation charge through gas fees, plus the other transaction fees.

> [!TIP]
>
> See the [NEAR account model](https://docs.near.org/protocol/accounts-contracts/account-model.md) for account types, access keys, and permissions.

***

## Implicit Accounts

An ED25519 implicit account ID is the 64-character lowercase hexadecimal encoding of its 32-byte public key. Exchanges can derive deposit addresses locally before creating the accounts on-chain. The corresponding private key signs transactions after account creation.

> [!NOTE]
>
> [NEAR implicit accounts](https://docs.near.org/protocol/accounts-contracts/account-id.md#implicit-address).

### Generate a key pair and account ID

These examples generate an ED25519 key pair and derive the account ID locally; they do not create the account on-chain.

> [tab] NEAR CLI
>
> The CLI saves the credentials to `~/.near-credentials/implicit`.
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> # Test environment should use the testnet, for production use mainnet
> export NEAR_ENV=testnet
>
> near account create-account fund-later use-auto-generation save-to-folder ~/.near-credentials/implicit
>
> # Example output:
> # The file "~/.near-credentials/implicit/8bca86065be487de45e795b2c3154fe834d53ffa07e0a44f29e76a2a5f075df8.json" was saved successfully
> #
> # Here is your console command if you need to script it or re-run:
> #     near account create-account fund-later use-auto-generation save-to-folder ~/.near-credentials/implicit
> ```

> [tab] near-api-js
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { KeyPairEd25519, baseDecode } from "near-api-js";
>
> const keyPair = KeyPairEd25519.fromRandom();
> const publicKey = keyPair.getPublicKey().toString();
> const accountId = Buffer.from(baseDecode(publicKey.split(":")[1])).toString("hex");
> const privateKey = keyPair.toString(); // Store securely for signing transactions.
>
> console.log({ accountId, publicKey });
> ```

> [accordion] How are Account IDs derived
>
> This Python example derives the account ID from a public key:
>
> ```python theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import base58
>
> public_key = 'ed25519:DGiK1ZZ4K5D89dz8YLKjhFz3xvJioSedgJbxtKna4DL6'
> pk58 = public_key.removeprefix('ed25519:')
> account_id = base58.b58decode(pk58).hex()
> print(account_id)
>
> # Output:
> # b652aa4a5697a1dd3151edf8edad3454fd3bf6b7f2c49787fccbea5c57635bab
> ```

### Create the account on-chain

Deriving an address locally does not create the account on-chain. Before the account can send transactions, including [meta-transactions](https://docs.near.org/web3-apps/tutorials/meta-transactions.md), it must be created on-chain and its creation charge paid.

The **first transfer to the address creates the account**, including a transfer of **0 NEAR**. The sender pays the **0.007 NEAR** creation charge through gas fees, plus other transaction fees. See [account creation costs](#account-creation-cost).

For example, [this transaction](https://testnet.nearblocks.io/txns/5bkXWTL159ZLMZurFHQGPefYYXmgTH3dZz6J8ihbQoWq) created the implicit account `f44f3...` by sending a zero-deposit transfer using the command:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near tokens influencer.testnet send-near f44f34572d483c73600d0b117b68901cab911e9363968d78c5d57501b7331bfd '0 NEAR' network-config testnet sign-with-keychain send
```

> [!TIP]
>
> Once created on-chain, an implicit account can send transactions using its access key. See [Sending Withdrawals](https://docs.near.org/integrations/create-transactions.md#send-a-transfer) for CLI and SDK examples.

***

## Key management and recovery

Backup keys can provide signing authority if another key is lost or deleted. Recovery depends on the access keys and contract permissions that remain available.

### Loss of [`FullAccess` key](https://docs.near.org/protocol/accounts-contracts/access-keys#full-access-keys)

Loss of the only `FullAccess` private key removes the ability to sign transactions with that key.

Only if the account had a smart contract with a recovery method implemented - which is not the default - can the account potentially be recovered after losing the `FullAccess` key.

### Loss of [`FunctionCall` access key](https://docs.near.org/protocol/accounts-contracts/access-keys#function-call-keys)

Function call keys do not have the authority to perform native transfers or replace other keys on the account.

Deleting a `FunctionCall` access key revokes its on-chain permissions to call methods on a specific smart contract. Be careful when removing these keys, specially if they are the only remaining access keys for the account.

***

## Frequently Asked Questions

> [accordion] What is a valid account ID?
>
> See [Account IDs](https://docs.near.org/protocol/accounts-contracts/account-id.md) for address formats and derivation.

> [accordion] What is the account model?
>
> User can have one or multiple NEAR Accounts. Each account lives on a single shard, can hold a smart contract, and store multiple keys for signing transactions.
>
> *You can read [more about NEAR accounts here](https://docs.near.org/protocol/accounts-contracts/account-model.md)*

> [accordion] How much does account creation cost?
>
> Account creation has a **0.007 NEAR** creation charge, collected through **gas fees**.
>
> NEAR supports **zero-balance accounts**: an account can be created with an [initial deposit of 0 NEAR](https://testnet.nearblocks.io/txns/5bkXWTL159ZLMZurFHQGPefYYXmgTH3dZz6J8ihbQoWq/execution), while the creator still pays the creation charge and transaction fees.

> [accordion] Is there a minimum account balance?
>
> Accounts pay for their own stored data. For accounts using **770 bytes or less**, the creation charge covers this storage, so no additional storage balance is required.
>
> Accounts using **more than 770 bytes** must reserve a balance to cover **all** their stored data, including the first 770 bytes, at **10^19 yoctoNEAR (0.00001 NEAR) per byte**. Query the current price using [`protocol_config`](https://docs.near.org/api/rpc/protocol#protocol-config); see [storage staking](https://docs.near.org/protocol/storage/storage-staking.md).
>
> Deleting stored data reduces the storage requirement, making any balance no longer needed for storage available.
>
> Creation charges and transaction gas are separate from the balance retained for storage; see [account creation costs](#account-creation-cost).
>
> An account can remain active with a zero balance if it meets the storage requirements above. Explicit deletion removes its native account state. Recreating the account starts with fresh state.

> [accordion] How many keys can an account have?
>
> An account can have arbitrarily many keys, as long as it has enough tokens for their storage.

> [accordion] How are cryptographic functions used?
>
> Account keys support `ed25519`, `secp256k1`, and `ML-DSA-65`, with different encodings and signing rules. The [transaction examples](https://docs.near.org/integrations/create-transactions.md) use ED25519. Consult the [cryptographic definitions for your node version](https://github.com/near/nearcore/tree/2.13.4/core/crypto/src) when implementing other key types.

> [accordion] Do you have a cold wallet implementation (ie. Ledger)?
>
> Yes, NEAR accounts can be managed with a Ledger hardware wallet using the [NEAR Ledger app](https://github.com/LedgerHQ/app-near).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.