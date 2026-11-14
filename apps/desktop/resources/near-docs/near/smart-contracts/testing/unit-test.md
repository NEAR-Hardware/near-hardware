> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Unit Testing

> Learn how to write and run unit tests for NEAR smart contracts to test individual methods and functions in isolation.

Smart contracts need both unit and sandbox tests:

1. **Unit tests** exercise methods individually. They are written in Rust alongside the contract and run locally.
2. **Sandbox tests** deploy the compiled contract to a local NEAR Sandbox and exercise it through transactions.

Use unit tests for contract logic and state changes. Use [sandbox tests](https://docs.near.org/smart-contracts/testing/integration-test.md) for behavior that depends on the runtime, including cross-contract calls, gas, attached deposits, and multiple accounts.

Use both types of tests during local development. Sandbox tests handle local accounts, balances, and contract setup in code, so you do not need a public account, faucet tokens, or a wallet login. When you are ready to share your contract, deploy it to testnet before releasing on mainnet.

***

Unit tests allow you to test the contract methods individually. They are suitable to check the storage is updated correctly, and that methods return their expected values. They are written in Rust alongside the contract's code and execute locally.

To run the unit tests, simply navigate to the contract's folder and run `cargo test`:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
cargo test
```

> [!TIP]
>
> `cargo test` runs both unit and [sandbox](https://docs.near.org/smart-contracts/testing/integration-test.md) tests present in the project.

***

## Snippet I: Testing a Counter

The tests in the [Counter Example](https://github.com/near-examples/counters) rely on basic functions to check that the `increment`, `decrement`, and `reset` methods work properly.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[test]
fn increment() {
    // instantiate a contract variable with the counter at zero
    let mut contract = Counter { val: 0 };
    contract.increment(None);
    assert_eq!(1, contract.get_num());
}

#[test]
fn increment_with_points() {
    // instantiate a contract variable with the counter at zero
    let mut contract = Counter { val: 0 };
    contract.increment(Some(10));
    assert_eq!(10, contract.get_num());
}

#[test]
fn decrement() {
    let mut contract = Counter { val: 0 };
    contract.decrement(None);
    assert_eq!(-1, contract.get_num());
}

#[test]
fn decrement_with_points() {
    // instantiate a contract variable with the counter at zero
    let mut contract = Counter { val: 0 };
    contract.decrement(Some(10));
    assert_eq!(-10, contract.get_num());
}

#[test]
fn increment_and_reset() {
    let mut contract = Counter { val: 0 };
    contract.increment(None);
    contract.reset();
    assert_eq!(0, contract.get_num());
}
```

[See code on GitHub](https://github.com/near-examples/counters/blob/a17b136735b7a41946d53bcec2344e68008b6864/contract-rs/src/lib.rs#L47-L84)

```toml title="Cargo.toml" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
[dev-dependencies]
near-sdk = { version = "5.29.0", features = ["unit-testing"] }
```

[See code on GitHub](https://github.com/near-examples/counters/blob/a17b136735b7a41946d53bcec2344e68008b6864/contract-rs/Cargo.toml#L18-L19)

***

## Snippet II: Modifying the Context

While doing unit testing you can modify the [Environment variables](https://docs.near.org/smart-contracts/anatomy/environment.md) through the `VMContextBuilder`. This will enable you to, for example, simulate calls from different users, with specific attached deposit and GAS. Here we present a snippet on how we test the `donate` method from our [Donation Example](https://github.com/near-examples/donation-examples) by manipulating the `predecessor` and `attached_deposit`.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[test]
fn donate() {
    let mut contract = Contract::init(BENEFICIARY.parse().unwrap());

    // Make a donation
    set_context("donor_a", ONE_NEAR);
    contract.donate();
    let first_donation = contract.get_donation_for_account("donor_a".parse().unwrap());

    // Check the donation was recorded correctly
    assert_eq!(
        u128::from(first_donation.total_amount),
        ONE_NEAR.as_yoctonear()
    );

    // Make another donation
    set_context("donor_b", ONE_NEAR.saturating_mul(2));
    contract.donate();
    let second_donation = contract.get_donation_for_account("donor_b".parse().unwrap());

    // Check the donation was recorded correctly
    assert_eq!(
        u128::from(second_donation.total_amount),
        ONE_NEAR.saturating_mul(2).as_yoctonear()
    );

    // User A makes another donation on top of their original
    set_context("donor_a", ONE_NEAR);
    contract.donate();
    let first_donation = contract.get_donation_for_account("donor_a".parse().unwrap());

    // Check the donation was recorded correctly
    assert_eq!(
        u128::from(first_donation.total_amount),
        ONE_NEAR.saturating_mul(2).as_yoctonear()
    );

    assert_eq!(u64::from(contract.number_of_donors()), 2);
}

// Auxiliar fn: create a mock context
fn set_context(predecessor: &str, amount: NearToken) {
    let mut builder = VMContextBuilder::new();
    builder.predecessor_account_id(predecessor.parse().unwrap());
    builder.attached_deposit(amount);

    testing_env!(builder.build());
}
```

[See code on GitHub](https://github.com/near-examples/donation-examples/blob/25df0dc9fa53eee44317e0f211ebf5c30443b161/contract-rs/src/lib.rs#L58-L105)

```toml title="Cargo.toml" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
[dev-dependencies]
near-sdk = { version = "5.29.0", features = ["unit-testing"] }
```

[See code on GitHub](https://github.com/near-examples/donation-examples/blob/25df0dc9fa53eee44317e0f211ebf5c30443b161/contract-rs/Cargo.toml#L18-L19)

***

## ⚠️ Limitations

Unit tests are useful to check for code integrity, and detect basic errors on isolated methods. However, since unit tests do not run on a blockchain, there are many things which they cannot detect. Unit tests are not suitable for:

* Testing [gas](https://docs.near.org/smart-contracts/anatomy/environment.md) and [storage](https://docs.near.org/smart-contracts/anatomy/storage.md) usage
* Testing [transfers](https://docs.near.org/smart-contracts/anatomy/actions.md)
* Testing [cross-contract calls](https://docs.near.org/smart-contracts/anatomy/crosscontract.md)
* Testing complex interactions, i.e. multiple users depositing money on the contract

For all these cases it is necessary to **complement** unit tests with [sandbox tests](https://docs.near.org/smart-contracts/testing/integration-test.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.