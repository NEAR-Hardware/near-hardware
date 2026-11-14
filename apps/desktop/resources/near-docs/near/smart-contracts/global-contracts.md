> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Global Contracts

> Deploy a contract once and reuse it across accounts.

Global contracts allow contract code to be deployed once and reused across multiple accounts. With regular deployments, each account pays the full storage deposit for its own copy of the Wasm code. With global contracts, each account stores a reference to shared code instead, reducing storage costs.

[NEP-0591](https://github.com/near/NEPs/blob/master/neps/nep-0591.md) introduces this code-sharing mechanism. Each account that uses the code keeps its own application state.

> [!TIP]
>
> Publishing a global contract under an account ID makes that ID a reference to reusable code. **It does not deploy an executable contract on that account.** To call methods on the account, you must separately deploy a regular contract there or attach global code with `UseGlobalContract`.

## Key Features

These are the features that make Global Contracts special:

* **Global Addressing**: Code is identified by its hash or publisher account ID. Accounts reference that identifier through `UseGlobalContract`, then receive calls at their own account IDs.

* **Code Versioning**: A reference by hash pins immutable code. A reference by publisher account ID follows updates published under that ID.

* **Shared Infrastructure**: Global contracts can act as canonical libraries, utility hubs, or standards for other contracts to rely on, simplifying development and reducing duplication.

* **Independent Instances**: Accounts reuse the same code while keeping separate storage, balances, and application state. Calls between instances follow the usual cross-contract execution model.

### Use Cases

* **Standard Libraries**: Reusable components for math, string operations, or token interfaces.
* **DeFi Protocols**: Global contracts can anchor DEXs, lending markets, oracles—shared across all applications.
* **DAO Frameworks**: Shared governance modules that any DAO can plug into, ensuring consistency and reliability.
* **Identity & Credentials**: Accounts can reuse identity verification and access management code while keeping their own state.
* **Multi-part dApps**: Complex applications can split responsibilities across shards while accessing a common logic core.

## Solution

Global Contracts solve the inefficiency of duplicate deployments by allowing the same contract code to be shared across multiple accounts, so storage cost is paid only once.

There are two ways to reference a global contract:

* **[By Account](#reference-by-account)**: an upgradable contract is published globally under a specific account ID.
* **[By Hash](#reference-by-hash)**: an immutable contract is deployed globally and identified by its code hash.

> [!NOTE]
>
> * The contract code is distributed across all shards in the Near Protocol network, not stored inside any specific account’s storage.
> * The account is charged 10x more for deploying a Global Contract, at the rate 10 NEAR per 100KB.
> * This amount is entirely burnt and cannot be recovered later, unlike regular deployments where Near is simply locked.
> * The total fee is typically under 0.001 NEAR for a user to use a Global Contract, since only a few bytes are needed for the reference that is stored in the account's storage.

### Reference by Account

When using a reference **by account**, the contract code is tied to another account. If that account later deploys a new version of the contract, your account will automatically start using the updated code, with no need for redeployment.

### Reference by Hash

When using a reference **by hash**, you reference the global contract by its immutable code hash. This ensures you're always using the exact same version, and it will never change unless you explicitly redeploy with a different hash.

## When to use Global Contracts

Ask yourself the following questions before deciding how to deploy your contracts:

* ***Are you working in a local environment?***

  If you're just testing or building a prototype, [regular deployments](https://docs.near.org/smart-contracts/release/deploy.md) are simpler and more flexible. There's no need to burn tokens or register global references — just deploy and iterate.

* ***Is the contract supposed to be deployed on many accounts?***

  If the same contract will be reused across many independent accounts — say, 10 or more — Global Contracts can significantly reduce overall cost and complexity. But if only a few accounts are involved, regular deployment remains the more economical choice.

* ***Are these accounts managed by your team?***

  If all target accounts are under your infrastructure, you may prefer regular deployments for flexibility and cost recovery.

* ***Are there more than 10 accounts?***

  Global Contracts become financially efficient when reused at scale. If you're deploying the same contract to more than 10 accounts, it's likely worth considering.

* ***Do you need to upgrade the contract across many accounts in one step, even if it requires burning tokens?***

  If you want to be able to push updates to all deployed instances at once, then go with Global Contracts by Account ID, but keep in mind that the deployment cost is non-refundable.

* ***Does your use case require the contract to be permanently immutable?***

  If the contract must never change, for example, due to security, compliance, or user trust, then using a Global Contract by Code Hash ensures immutability at the protocol level.

## Deploying a Global Contract

> [!NOTE]
>
> Publishing a global contract under an account ID makes that ID a reference to reusable code. **It does not deploy an executable contract on that account.** To call methods on the account, you must separately deploy a regular contract there or attach global code with `UseGlobalContract`.

Global contracts can be deployed by hash or by account ID. Contracts deployed by hash are immutable. When a contract is deployed by account ID, its owner can redeploy the code and update every account that uses that reference.

> [!NOTE]
>
> Deploying a global contract incurs high storage costs. Tokens are burned to compensate for storing the contract on-chain, unlike regular contracts where tokens are locked based on contract size.

> [tab] CLI
>
> Deploy by account ID:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near contract deploy-as-global use-file <path-to-wasm> as-global-account-id <account-id> network-config testnet sign-with-keychain send
> ```
>
> Deploy by hash:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near contract deploy-as-global use-file <path-to-wasm> as-global-hash <account-id> network-config testnet sign-with-keychain send
> ```

> [tab] Rust
>
> Use `deploy_global_contract_code` with `as_account_id` to deploy by account:
>
> ```rust title="global_contract_accountid.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> let global_account_id: AccountId = account_id_string.parse().unwrap();
> let global_code = std::fs::read("../contracts/contract.wasm").unwrap();
> let global_signer = Signer::from_secret_key(private_key).unwrap();
>
> // Deploy the global contract code using the account ID `nft-contract.testnet`
> // This will deploy the contract to the specified account ID
> // and return the final execution outcome
> let result = Contract::deploy_global_contract_code(global_code)
>     .as_account_id(global_account_id.clone())
>     .with_signer(global_signer.clone())
>     .send_to_testnet()
>     .await
>     .unwrap();
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-api-examples/blob/fe8a9b52688965ef272fc2e199fcd46111ff3ade/near-api-rs/examples/global_contract_accountid.rs#L16-L28)
>
> Use `deploy_global_contract_code` with `as_hash` to deploy by hash:
>
> ```rust title="global_contract_hash.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> let account_id: AccountId = account_id_string.parse().unwrap();
> let code = std::fs::read("../contracts/contract.wasm").unwrap();
> let signer = Signer::from_secret_key(private_key).unwrap();
>
> // Deploy the global contract code using a hash
> // This will deploy the contract to the global contract hash
> // and return the final execution outcome
> let result = Contract::deploy_global_contract_code(code.clone())
>     .as_hash()
>     .with_signer(account_id.clone(), signer.clone())
>     .send_to_testnet()
>     .await
>     .unwrap();
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-api-examples/blob/fe8a9b52688965ef272fc2e199fcd46111ff3ade/near-api-rs/examples/global_contract_hash.rs#L16-L28)

## Using a Global Contract

After the global code is deployed, attach it to an account with the `UseGlobalContract` action, referencing the publisher account ID or code hash. The CLI commands below create this action for `<account-id>`; subsequent function calls target `<account-id>`.

If the contract requires initialization, attach the code and call its initializer in the same transaction with `with-init-call`, as shown in the [NFT deployment guide](https://docs.near.org/primitives/nft/nft.md#global-contract). This prevents another caller from initializing your instance first. The `without-init-call` examples below only attach the code; they do not initialize contract state.

> [tab] CLI
>
> Use a contract published by account ID:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near contract deploy <account-id> use-global-account-id <global-contract-account-id> without-init-call network-config testnet
> ```
>
> Use a contract published by hash:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near contract deploy <account-id> use-global-hash <global-contract-hash> without-init-call network-config testnet
> ```

> [tab] Rust
>
> Reference a global contract by account ID with `use_global_account_id`:
>
> ```rust title="global_contract_accountid.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> // Please note that you have to trust the account-id that you are providing. As the code is mutable, the owner of the referenced account can
> // change the code at any time which might lead to unexpected behavior or malicious activity.
> let my_signer = Signer::from_secret_key(private_key).unwrap();
>
> let result = Contract::deploy(new_account_id)
>     .use_global_account_id(global_account_id)
>     .without_init_call()
>     .with_signer(my_signer)
>     .send_to_testnet()
>     .await
>     .unwrap();
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-api-examples/blob/fe8a9b52688965ef272fc2e199fcd46111ff3ade/near-api-rs/examples/global_contract_accountid.rs#L61-L71)
>
> To reference a global contract by hash, calculate its code hash and call `use_global_hash`:
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> let code = std::fs::read("../contracts/contract.wasm").unwrap();
> let global_hash = near_api::CryptoHash::hash(&code);
> ```
>
> ```rust title="global_contract_hash.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> // Prepare a transaction to deploy a contract to the provided account using an immutable hash reference to the code from the global contract code storage.
> let my_signer = Signer::from_secret_key(private_key).unwrap();
>
> let result = Contract::deploy(new_account_id)
>     .use_global_hash(global_hash)
>     .without_init_call()
>     .with_signer(my_signer)
>     .send_to_testnet()
>     .await
>     .unwrap();
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-api-examples/blob/fe8a9b52688965ef272fc2e199fcd46111ff3ade/near-api-rs/examples/global_contract_hash.rs#L62-L71)

> [!TIP]
>
> See the [NEAR API examples](https://docs.near.org/tools/near-api.md#deploy-a-global-contract) for complete Rust deployment and usage flows.

### Updating global contracts

If a contract is expected to get upgrades from time to time, then it should be rolled out using the `Account Id` strategy. Using a Global Contract by `Hash` is for immutable contracts that are supposed to stay the same forever.

Keep in mind, when using a Global Contract by [account ID](#reference-by-account), the one that handles the contract update is the original account, so they're responsible for contract state upgrading too.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.