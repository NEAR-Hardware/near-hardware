---
name: near-contracts
description: Write a NEAR smart contract in Rust, test it, build it with cargo-near, deploy it to a sub-account of the user's NEAR account (testnet or mainnet) through NEAR Hardware, and use it with view and change calls.
---

# Build, deploy and use a NEAR contract

Contracts are Rust compiled to WebAssembly. You write and build them in the project with the user's toolchain; you deploy and call them with the `near_*` tools, which sign with the user's accounts inside NEAR Hardware (read `near-accounts` first). Every step below was run end to end on testnet.

When you need more than this page, search NEAR's bundled docs instead of guessing: `near_docs_search { "query": "...", "section": "smart-contracts" }`, then `near_docs_read`. Key pages: `near/smart-contracts/quickstart.md`, `near/smart-contracts/anatomy/*.md` (functions, storage, collections, actions, cross-contract calls, environment), `near/smart-contracts/testing/*.md`, `near/smart-contracts/release/deploy.md` and `upgrade.md`, `near/smart-contracts/security/*.md`.

## 1. Toolchain

```sh
rustc --version && cargo near --version && rustup target list --installed | grep wasm32
```

If anything is missing, ask the user to install it from NEAR Hardware (setup guide › Smart contracts, or Environments › Smart contract tools), or with their OK run the official installers:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && . "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/cargo-near/releases/latest/download/cargo-near-installer.sh | sh
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh
```

## 2. Create the project

Keep contracts in a `contract/` folder inside the hardware project, next to the firmware:

```sh
cargo near new contract < /dev/null
```

What you get (cargo-near 0.23):

- `src/lib.rs`: an **auction** example (`init`, `bid`, `claim`, views). Replace it with your contract.
- `tests/test_basics.rs`: sandbox tests for that auction. Delete or rewrite it when you replace the auction, or `cargo test` fails to compile.
- `rust-toolchain.toml`: pins a Rust version (1.95.0 today). The first build downloads it once, so the first `cargo test` or build takes 2-3 minutes; later builds take seconds.
- `Cargo.toml` with `near-sdk` 5.30.

## 3. Write it

```rust
// A counter anyone can increment; it remembers who called last
use near_sdk::{AccountId, env, near};

#[near(contract_state)]
#[derive(Default)]
pub struct Counter {
    count: u64,
    last_caller: Option<AccountId>,
}

#[near]
impl Counter {
    // View methods (&self): free, no transaction
    pub fn get_count(&self) -> u64 {
        self.count
    }

    pub fn get_last_caller(&self) -> Option<AccountId> {
        self.last_caller.clone()
    }

    // Change methods (&mut self): signed transactions
    pub fn increment(&mut self) -> u64 {
        let caller = env::predecessor_account_id();
        self.count += 1;
        env::log_str(&format!("{caller} incremented the count to {}", self.count));
        self.last_caller = Some(caller);
        self.count
    }

    // Only the contract's own account may call this
    #[private]
    pub fn reset(&mut self) {
        self.count = 0;
    }
}
```

Essentials:

- `env::predecessor_account_id()` is who called; use it for access control (e.g. only `watch.alice.testnet` may `record`).
- `#[private]`: only the contract account itself. `#[payable]`: the method accepts attached NEAR (`env::attached_deposit()`); without it, calls with a deposit fail.
- State needs initialization? Use `#[derive(PanicOnDefault)]` plus an `#[init] pub fn new(...) -> Self`, and deploy with `initMethod`. With `#[derive(Default)]` (above) no init is needed.
- Big data goes in `near_sdk::store` collections (`IterableMap`, `Vector`, `LookupMap`), not plain `Vec`/`HashMap`; see `anatomy/collections.md`.
- Use `U64`/`U128` from `near_sdk::json_types` for numbers in JSON arguments and results above 2^53.

## 4. Test

```sh
cargo test --lib   # unit tests, fast
cargo test         # also sandbox tests (downloads a local NEAR node once)
```

Unit test pattern:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{VMContextBuilder, accounts};
    use near_sdk::testing_env;

    #[test]
    fn increments() {
        testing_env!(VMContextBuilder::new().predecessor_account_id(accounts(1)).build());
        let mut contract = Counter::default();
        assert_eq!(contract.increment(), 1);
        assert_eq!(contract.get_last_caller(), Some(accounts(1)));
    }
}
```

## 5. Build

```sh
cd contract && cargo near build non-reproducible-wasm
```

Output: `contract/target/near/<crate_name>.wasm` (about 38 KB for the counter) plus an ABI JSON. For a mainnet release that others should verify, `cargo near build reproducible-wasm` builds in Docker instead.

## 6. Deploy to its own account

Never deploy to the user's main account. Give the contract a sub-account with NEAR for storage (about 1 NEAR per 100 KB of wasm, plus its data): `"1"` is plenty for a small contract on testnet.

```
near_create_subaccount { "network": "testnet", "name": "counter", "initialBalance": "1" }
near_deploy_contract   { "network": "testnet", "accountId": "counter.<primary>",
                         "wasmPath": "contract/target/near/contract.wasm" }
```

Deploying right after creating the account works (the app waits for the new key). With an init method: add `"initMethod": "new", "initArgs": { ... }` to deploy and initialize in one transaction. Redeploying replaces the code but keeps stored state; if the state layout changed, read `release/upgrade.md` or deploy to a fresh sub-account.

## 7. Use it

```
near_view { "contractId": "counter.<primary>", "method": "get_count" }          → 0
near_call { "contractId": "counter.<primary>", "method": "increment" }          → result 1, logs
near_view { "contractId": "counter.<primary>", "method": "get_last_caller" }    → "<primary>"
```

Results carry `logs`, the return value and an `explorer` link: share the link. A contract panic comes back as `ok: false` with `failure`, e.g. calling `reset` from another account: `Smart contract panicked: Method reset is private`.

## 8. Mainnet

The same steps with `"network": "mainnet"`, on the user's mainnet account (e.g. `counter.alice.near`). It costs real NEAR (storage plus tiny gas fees) and the user approves every transaction. Test on testnet first, keep `initialBalance` small, and tell the user what it will cost before you start.

## 9. Give devices and agents access

Create limited sub-accounts that may only call this contract (see `near-subaccounts`), e.g. a `bot` for yourself or one per board with the board's own key. Put the contract ID and network in `BOARD.md` so firmware and frontends know where to send calls. To put the contract on the web, see `near-web-apps`.
