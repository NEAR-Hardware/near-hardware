> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# NEAR CLI

> Interact with NEAR through the terminal.

The NEAR [Command Line Interface](https://github.com/near/near-cli-rs) (CLI) is a tool that enables you to interact with the NEAR network directly from the shell. Among other things, the NEAR CLI enables you to create and manage accounts, send tokens such as NEAR, FTs and NFTs, deploy smart contracts, call functions on those contracts, and manage access keys.

## Installation

> [tab] npm
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install -g near-cli-rs@latest
> ```

> [tab] Homebrew
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> brew install near
> ```

> [tab] Cargo
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> cargo install near-cli-rs
> ```

> [tab] Mac and Linux (binaries)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh
> ```

> [tab] Windows (binaries)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> irm https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.ps1 | iex
> ```

## Configuration file

The directory with access keys and available connection networks are defined in the configuration file (`near-cli/config.toml`), which is located depending on the operating system in the following places:

* macOS: `$HOME/Library/Application Support` (e.g. `/Users/Alice/Library/Application Support`)
* Linux: `$XDG_CONFIG_HOME` or `$HOME/.config` (e.g. `/home/alice/.config`)
* Windows: `{FOLDERID_RoamingAppData}` (e.g. `C:\Users\Alice\AppData\Roaming`)

You can learn more about working with the configuration file [here](https://github.com/near/near-cli-rs/blob/main/docs/GUIDE.en.md#config---manage-connections-in-a-configuration-file).

> [!TIP]
>
> You can set up a custom [RPC server](https://docs.near.org/api/rpc/providers.md) by changing the `rpc_url` parameter in `near-cli` settings:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near config edit-connection testnet --key rpc_url --value https://archival-rpc.testnet.near.org/
> ```

### Localnet configuration values

When setting up a localnet connection with `near config add-connection`, several optional fields can be configured. Most of them can be skipped or set to placeholder URLs — they are only used for specific commands and are not required for basic localnet usage.

| Field | Purpose | Localnet recommendation |
| - | - | - |
| `rpc_url` | RPC endpoint for all blockchain interactions | `http://localhost:3030/` |
| `wallet_url` | Used to construct a URL for importing accounts from a Web wallet | Any URL (e.g. `http://localhost`) or a local wallet if available |
| `explorer_transaction_url` | Printed after a transaction is signed as `<url>/<tx-hash>` | Any URL (e.g. `http://localhost`) or omit |
| `linkdrop_account_id` | Account with the [near-linkdrop](https://github.com/near/near-linkdrop) contract, used by `account create-account fund-myself` | Can be skipped; use `testnet` as a placeholder if needed |
| `near_social_db_contract_account_id` | NEAR Social contract account, used for `account view-account-summary` and `account update-social-profile` | Can be skipped |
| `faucet_url` | Service that creates new accounts without requiring NEAR tokens, used by `account create-account sponsor-by-faucet-service` | Can be skipped |
| `fastnear_url` | FastNEAR API for fetching staking pool delegations, used by `account view-account-summary` | Can be skipped |
| `staking_pools_factory_account_id` | Fallback to FastNEAR — queries all staking pools individually; used by `account view-account-summary` | Can be skipped |
| `mpc_contract_account_id` | MPC signing service contract, used to sign payloads and control other accounts | Can be skipped unless running a local MPC node |

A minimal localnet connection requires only `rpc_url`. The other values are only needed when using the specific commands listed above.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near config add-connection \
  --network-name localnet \
  --connection-name localnet-sandbox \
  --rpc-url http://localhost:3030/ \
  --wallet-url http://localhost/ \
  --explorer-transaction-url http://localhost/
```

## Interactive mode

To use the `near-cli` simply run the following in your terminal.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near
```

You should then see the following. Use the arrow keys and hit `enter` or simply type out one of the available options to select an option.

![NEAR CLI interactive mode](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/tools/near-cli-rs.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=035ed109b136f96248526e6635383326)

> [!NOTE]
>
> We provide examples only of the most used commands. Such commands may have two versions — a **full** one and a **short** one. If you want to explore all options provided by `near-cli`, use the interactive mode described above.

## Account

This option will allow you to manage, control, and retrieve information on your accounts.

### Summary

`view-account-summary` - view properties for an account.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account view-account-summary $ACCOUNT_ID network-config testnet now
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near state $ACCOUNT_ID --networkId testnet
> ```

### Import

`import-account` - import existing account (a.k.a. "sign in").

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near account import-account using-web-wallet network-config testnet
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near login --networkId testnet
> ```

### Export

`export-account` - export existing account.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet
near account export-account $ACCOUNT_ID using-web-wallet network-config testnet
```

### Create

`create-account` - create a new account.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account create-account sponsor-by-faucet-service $ACCOUNT_ID autogenerate-new-keypair save-to-keychain network-config testnet create
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near create-account $ACCOUNT_ID --useFaucet --networkId testnet
> ```

### Delete

`delete-account` - delete an account.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> export BENEFICIARY_ID=alice.testnet
>
> near account delete-account $ACCOUNT_ID beneficiary $BENEFICIARY_ID network-config testnet sign-with-keychain send
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> export BENEFICIARY_ID=alice.testnet
>
> near delete-account $ACCOUNT_ID $BENEFICIARY_ID --networkId testnet
> ```

## Keys

Generating, showing, adding and removing account keys. NEAR keys can use any of the supported [signature schemes](https://docs.near.org/protocol/accounts-contracts/access-keys.md#signature-schemes): `ed25519` (default), `secp256k1`, or the post-quantum `ml-dsa-65`.

### Generate a key pair

`generate-keypair` - create a fresh key pair offline, without touching an account or the network. Use `--signature-scheme` to choose the scheme (defaults to `ed25519`).

> [tab] Ed25519
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> # Print a new key pair to the terminal
> near generate-keypair print-to-terminal
>
> # ...or save it to a JSON file
> near generate-keypair save-to-file ./my-key.json
> ```

> [tab] ML-DSA-65 (post-quantum)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> # Print a new post-quantum key pair to the terminal
> near generate-keypair --signature-scheme ml-dsa-65 print-to-terminal
>
> # ...or save it to a JSON file
> near generate-keypair --signature-scheme ml-dsa-65 save-to-file ./pq-key.json
> ```

> [!NOTE]
>
> Run in an interactive terminal without `--signature-scheme` and the CLI prompts you to pick a scheme; otherwise it defaults to `ed25519`. Unlike `ed25519`, `ml-dsa-65` key pairs are generated randomly and have no seed phrase or implicit-account address — be sure to back up the saved key file.

### List keys

`list-keys` - view a list of keys for an account.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account list-keys $ACCOUNT_ID network-config testnet now
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near list-keys $ACCOUNT_ID --networkId testnet
> ```

### Add key

`add-key` - add an access key to an account.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account add-key $ACCOUNT_ID grant-full-access use-manually-provided-public-key ed25519:CXqAs8c8kZz81josLw82RQsnZXk8CAdUo7jAuN7uSht2 network-config testnet sign-with-keychain send
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near add-key $ACCOUNT_ID ed25519:CXqAs8c8kZz81josLw82RQsnZXk8CAdUo7jAuN7uSht2 --networkId testnet
> ```

Instead of providing a key, you can have the CLI **autogenerate** one and add it in a single step with `autogenerate-new-keypair --signature-scheme <scheme>`:

> [tab] Ed25519
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account add-key $ACCOUNT_ID grant-full-access autogenerate-new-keypair save-to-keychain network-config testnet sign-with-keychain send
> ```

> [tab] ML-DSA-65 (post-quantum)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account add-key $ACCOUNT_ID grant-full-access autogenerate-new-keypair --signature-scheme ml-dsa-65 save-to-keychain network-config testnet sign-with-keychain send
> ```

> [!NOTE]
>
> The same `--signature-scheme` flag is available on the `account create-account fund-myself` and `sponsor-by-faucet-service` autogenerate flows. You can also add an externally generated `ml-dsa-65:<base58>` key through the `use-manually-provided-public-key` flow shown above. An `ml-dsa-65` key has **no implicit-account form** — you can't derive a new implicit account from one — but you can add it to any **existing** account, named or implicit, just like any other key.

### Delete key

`delete-keys` - delete an access key from an account.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near account delete-keys $ACCOUNT_ID public-keys ed25519:HdkFZFEPoWfgrrLK3R4t5dWtNoLC8WymBzhCXoP3zrjh network-config testnet sign-with-keychain send
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> near delete-key $ACCOUNT_ID ed25519:HdkFZFEPoWfgrrLK3R4t5dWtNoLC8WymBzhCXoP3zrjh --networkId testnet
> ```

> [!NOTE]
>
> The interactive key picker only lists `ed25519` and `secp256k1` keys. A post-quantum `ml-dsa-65` key is stored on-chain only as a hash, so its full public key can't be read back from the network — to delete one, pass the full `ml-dsa-65:<base58>` key explicitly to the `public-keys` argument of `near account delete-keys` (the full command form shown above).

### Gas keys

[Gas keys](https://docs.near.org/protocol/accounts-contracts/gas-keys.md) are access keys with their own prepaid gas balance and up to 1,024 parallel nonces. The `add-key` command can create them through the `grant-gas-key-full-access` and `grant-gas-key-function-call` modes, and dedicated commands manage their balance and nonces.

A gas key is always created empty — fund it with `fund-gas-key` before using it:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet

# Create a full-access gas key with 8 parallel nonces
near account add-key $ACCOUNT_ID grant-gas-key-full-access --num-nonces 8 autogenerate-new-keypair save-to-keychain network-config testnet sign-with-keychain send

# Transfer 5 NEAR from the account into the gas key's balance
near account fund-gas-key $ACCOUNT_ID ed25519:CXqAs8c8kZz81josLw82RQsnZXk8CAdUo7jAuN7uSht2 '5 NEAR' network-config testnet sign-with-keychain send

# View the current nonce of each of the key's lanes
near account view-gas-key-nonces $ACCOUNT_ID ed25519:CXqAs8c8kZz81josLw82RQsnZXk8CAdUo7jAuN7uSht2 network-config testnet now

# Move 2 NEAR from the gas key's balance back to the account
near account withdraw-from-gas-key $ACCOUNT_ID ed25519:CXqAs8c8kZz81josLw82RQsnZXk8CAdUo7jAuN7uSht2 '2 NEAR' network-config testnet sign-with-keychain send
```

To sign a transaction with a gas key, pass `--nonce-index` to the signing option to choose which nonce lane to use (defaults to lane `0`):

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near tokens $ACCOUNT_ID send-near alice.testnet '1 NEAR' network-config testnet sign-with-keychain --nonce-index 3 send
```

Gas keys also work with **meta transactions**. The CLI signs as a delegate action when the selected network connection has a relayer configured (a `meta_transaction_relayer_url`, set on the connection with `near config add-connection`). Signing such a transaction with `--nonce-index` then produces a [`DelegateV2`](https://docs.near.org/protocol/transactions/meta-tx#delegatev2-meta-transactions-with-gas-keys) delegate action bound to that nonce lane, which the relayer wraps and pays for.

> [!NOTE]
>
> Deleting a gas key **burns** any balance left on it, and fails if the balance exceeds 1 NEAR — withdraw first with `withdraw-from-gas-key`, then delete with the regular `delete-keys` command. Gas-key meta transactions are supported for all software signers; Ledger is the exception, since the device firmware cannot yet produce a `DelegateV2` signature.

## Tokens

This will allow you to manage your token assets such as NEAR, FTs and NFTs.

### Send NEAR

`send-near` - transfers NEAR to a specified recipient in units of NEAR or yoctoNEAR.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> export RECEIVER_ID=alice.testnet
> near tokens $ACCOUNT_ID send-near $RECEIVER_ID '0.5 NEAR' network-config testnet sign-with-keychain send
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export ACCOUNT_ID=bob.testnet
> export RECEIVER_ID=alice.testnet
>
> near send-near $ACCOUNT_ID $RECEIVER_ID 0.5 --networkId testnet
> ```

### Send FT

`send-ft` - transfer Fungible Tokens to a specified user.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet
export RECEIVER_ID=alice.testnet
export FT_CONTRACT_ID=0c97251cd1f630c444dbusdt.testnet

near tokens $ACCOUNT_ID send-ft $FT_CONTRACT_ID $RECEIVER_ID amount-ft '1 USDT' prepaid-gas '100.0 Tgas' attached-deposit '1 yoctoNEAR' network-config testnet sign-with-keychain send
```

### Send NFT

`send-nft` - transfers NFTs between accounts.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet
export RECEIVER_ID=alice.testnet
export NFT_CONTRACT_ID=nft.examples.testnet

near tokens $ACCOUNT_ID send-nft $NFT_CONTRACT_ID $RECEIVER_ID 1 --prepaid-gas '100.0 Tgas' --attached-deposit '1 yoctoNEAR' network-config testnet sign-with-keychain send
```

### View NEAR balance

`view-near-balance` - view the balance of NEAR tokens.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet
near tokens $ACCOUNT_ID view-near-balance network-config testnet now
```

### View FT balance

`view-ft-balance` - view the balance of Fungible Tokens.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet
export FT_CONTRACT_ID=0c97251cd1f630c444dbusdt.testnet
near tokens $ACCOUNT_ID view-ft-balance $FT_CONTRACT_ID network-config testnet now
```

### View NFT balance

`view-nft-assets` - view the balance of NFT tokens.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
export ACCOUNT_ID=bob.testnet
export NFT_CONTRACT_ID=nft.examples.testnet
near tokens $ACCOUNT_ID view-nft-assets $NFT_CONTRACT_ID network-config testnet now
```

## Contract

This option allows you to manage and interact with your smart contracts.

### Call

`call-function` - execute function (contract method).

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> # View method
> export CONTRACT_ID=nft.examples.testnet
> near contract call-function as-read-only $CONTRACT_ID nft_tokens json-args '{"from_index": "0", "limit": 2}' network-config testnet now
>
> # Call method
> export ACCOUNT_ID=bob.testnet
> near contract call-function as-transaction $CONTRACT_ID nft_mint json-args '{"metadata": {"copies": 1, "description": "The Team Goes", "media": "https://bafybeidl4hjbpdr6u6xvlrizwxbrfcyqurzvcnn5xoilmcqbxfbdwrmp5m.ipfs.dweb.link/", "title": "GO TEAM"}, "receiver_id": "bob.testnet", "token_id": "5895"}' prepaid-gas '100.0 Tgas' attached-deposit '0.1 NEAR' sign-as $ACCOUNT_ID network-config testnet sign-with-keychain send
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> # View method
> export CONTRACT_ID=nft.examples.testnet
> near view $CONTRACT_ID nft_tokens '{"from_index": "0", "limit": 2}' --networkId testnet
>
> # Call method
> export ACCOUNT_ID=bob.testnet
> near call $CONTRACT_ID nft_mint '{"metadata": {"copies": 1, "description": "The Team Goes", "media": "https://bafybeidl4hjbpdr6u6xvlrizwxbrfcyqurzvcnn5xoilmcqbxfbdwrmp5m.ipfs.dweb.link/", "title": "GO TEAM"}, "receiver_id": "bob.testnet", "token_id": "5896"}' --deposit 0.1 --useAccount $ACCOUNT_ID --networkId testnet
> ```

### Deploy

`deploy` - add a new contract code.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export CONTRACT_ID=contract.testnet
> near contract deploy $CONTRACT_ID use-file ../target/near/contract.wasm without-init-call network-config testnet sign-with-keychain send
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export CONTRACT_ID=contract.testnet
> near deploy $CONTRACT_ID ../target/near/contract.wasm --networkId testnet
> ```

### Create deterministic accounts

Use `near contract state-init` to create a [deterministic account](https://docs.near.org/protocol/accounts-contracts/account-id.md#deterministic-address) from a global contract and initial storage. The CLI derives the `0s` address for you.

The global contract must already be deployed. Replace `publisher.testnet` with its account ID and `alice.testnet` with the account signing and paying for the transaction:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near contract state-init use-global-account-id publisher.testnet \
  data-from-json '{}' execute '0.1 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send
```

`data-from-json` takes a JSON object with Base64-encoded storage keys and values; `{}` starts with empty storage. The deposit covers storage costs, and any excess is refunded.

To compute the address without creating the account, use the same code reference and storage with `inspect account-id`:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near contract state-init use-global-account-id publisher.testnet \
  data-from-json '{}' inspect account-id
```

You can also reference a global contract by its code hash using `use-global-hash` instead of `use-global-account-id`.

### Inspect

`inspect` - get a list of available function names.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export CONTRACT_ID=nft.examples.testnet
> near contract view-storage $CONTRACT_ID all as-text network-config testnet now
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> export CONTRACT_ID=nft.examples.testnet
> near storage $CONTRACT_ID --finality final --utf8 --networkId testnet
> ```

## Transaction

Operate transactions.

### View status

`view-status` - view a transaction status.

> [tab] Full
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near transaction view-status BFrVVtjqD2p1zYX1UCvn4nJpy7zPHpY5cTgQaKCZjBvw network-config testnet
> ```

> [tab] Short
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near tx-status BFrVVtjqD2p1zYX1UCvn4nJpy7zPHpY5cTgQaKCZjBvw --networkId testnet
> ```

## Config

Manage the connection parameters inside the `config.toml` file for `near-cli`.

This will allow you to change or modify the network connections for your CLI.

### Show connections

`show-connections` - show a list of network connections.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near config show-connections
```

### Edit connection

`edit-connection` - edit a network connection.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near config edit-connection testnet --key rpc_url --value https://test.rpc.fastnear.com
```

> [!NOTE]
>
> We provide examples only of the most used commands. If you want to explore all options provided by `near-cli`, use the [interactive mode](#interactive-mode).

## Validators

You can use the following commands to interact with the blockchain and view validator stats. There are three reports used to monitor validator status:

* [Proposals](#proposals)
* [Current validators](#current-validators)
* [Next validators](#next-validators)

> [!TIP]
>
> To use these commands, you **must** install the CLI [validator extension](#validator-extension).

### Validator extension

If you want to interact with [NEAR Validators](https://pages.near.org/papers/economics-in-sharded-blockchain/#validators) from command line, you can install the [NEAR Validator CLI Extension](https://github.com/near-cli-rs/near-validator-cli-rs):

> [tab] npm
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install -g near-validator
> ```

> [tab] Cargo
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> cargo install near-validator
> ```

> [tab] Mac and Linux (binaries)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near-cli-rs/near-validator-cli-rs/releases/latest/download/near-validator-installer.sh | sh
> ```

> [tab] Windows (binaries)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> irm https://github.com/near-cli-rs/near-validator-cli-rs/releases/latest/download/near-validator-installer.ps1 | iex
> ```

### Proposals

A proposal by a validator indicates they would like to enter the validator set. In order for a proposal to be accepted it must meet the minimum seat price.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near-validator proposals network-config mainnet
```

### Current validators

This shows a list of active validators in the current epoch, the number of blocks produced, number of blocks expected, and online rate. Used to monitor if a validator is having issues.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near-validator validators network-config mainnet now
```

### Next validators

This shows validators whose proposal was accepted one epoch ago, and that will enter the validator set in the next epoch.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near-validator validators network-config mainnet next
```

### Staking

For validators, there's also an option to stake NEAR tokens without deploying a staking pool smart contract.

#### View validator stake

To view the validator's stake on the last block:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near-validator staking view-stake examples.testnet network-config testnet now
```

#### Stake directly without a staking pool

To stake the amount:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near-validator staking stake-proposal examples.testnet ed25519:AiEo5xepXjY7ChihZJ6AsfoDAaUowhPgvQp997qnFuRP '1500 NEAR' network-config testnet sign-with-keychain send
```

#### Unstake directly without a staking pool

To unstake:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near-validator staking unstake-proposal examples.testnet ed25519:AiEo5xepXjY7ChihZJ6AsfoDAaUowhPgvQp997qnFuRP network-config testnet sign-with-keychain send
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.