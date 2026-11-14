> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# State

> Explore how NEAR smart contracts manage their state.

Smart contracts store data in their account's state, which is public on the chain. The storage starts **empty** until a contract is deployed and the state is initialized.

It is important to know that the account's **code** and account's **storage** are **independent**. [Updating the code](https://docs.near.org/smart-contracts/release/upgrade.md) does **not erase** the state.

## Defining the State

The attributes of the `struct` marked as the contract define the data that will be stored.

> [!WARNING]
>
> **Store only what the contract needs.** Contract state is not a database for your app: storage requires staking NEAR, and data your app only displays can be read from the contract's transactions with an indexer. Never store values you can derive from other stored values. See [A contract is not a backend](https://docs.near.org/smart-contracts/what-is.md#a-contract-is-not-a-backend).

The contract can store all native types (e.g. `u8`, `string`, `HashMap`, `Vector`) as well as complex objects.

For example, our Auction contract stores when the auction ends, and an object representing the highest bid.

> [!NOTE]
>
> The structures that will be saved need a special macro that tells the SDK to store them [serialized in Borsh](https://docs.near.org/smart-contracts/anatomy/serialization.md).

> [!NOTE]
>
> The SDK also provides [collections](https://docs.near.org/smart-contracts/anatomy/collections.md) to efficiently store collections of data.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Bid {
    pub bidder: AccountId,
    pub bid: NearToken,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    highest_bid: Bid,
    auction_end_time: U64,
    auctioneer: AccountId,
    claimed: bool,
}
```

[See code on GitHub](https://github.com/near-examples/auctions-tutorial/blob/4678765ea7f2a584b1a6569786d497dcf75f5261/contract-rs/01-basic-auction/src/lib.rs#L5-L19)

> [!WARNING]
>
> Contracts pay for their storage by locking part of their balance.
>
> It currently costs \~**1Ⓝ** to store **100KB** of data.

## Initializing the State

After the contract is deployed, its state is empty and needs to be initialized with
some initial values.

There are two ways to initialize a state:

1. By creating an initialization function
2. By setting default values

### I. Initialization Functions

An option to initialize the state is to create an `initialization` function, which needs to be called before executing any other function.

In our Auction example, the contract has an initialization function that sets when the auction ends. The contract derives the `PanicOnDefault`, which forces the user to call the init method denoted by the `#[init]` macro.

> [!NOTE]
>
> It is a good practice to mark initialization functions as private. We will cover function types in the [functions section](https://docs.near.org/smart-contracts/anatomy/functions.md).

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    highest_bid: Bid,
    auction_end_time: U64,
    auctioneer: AccountId,
    claimed: bool,
}
```

[See code on GitHub](https://github.com/near-examples/auctions-tutorial/blob/4678765ea7f2a584b1a6569786d497dcf75f5261/contract-rs/01-basic-auction/src/lib.rs#L12-L19)

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[init]
pub fn init(end_time: U64, auctioneer: AccountId) -> Self {
    Self {
        highest_bid: Bid {
            bidder: env::current_account_id(),
            bid: NearToken::from_yoctonear(1),
        },
        auction_end_time: end_time,
        claimed: false,
        auctioneer,
    }
}
```

[See code on GitHub](https://github.com/near-examples/auctions-tutorial/blob/4678765ea7f2a584b1a6569786d497dcf75f5261/contract-rs/01-basic-auction/src/lib.rs#L23-L34)

### II. Default State

Another option to initialize the state is to create a `Default` version of our contract's `struct`.

For example, our "Hello World" contract has a default state with a `greeting` set to `"Hello"`.

The first time the contract executes, the `Default` will be stored in the state, and the state will be considered initialized.

> [!NOTE]
>
> The state can only be initialized once.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[near(contract_state)]
pub struct Contract {
    greeting: String,
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L5-L8)

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
impl Default for Contract {
    fn default() -> Self {
        Self {
            greeting: "Hello".to_string(),
        }
    }
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L11-L17)

> [!NOTE]
>
> **Lifecycle of the State**
>
> When a function is called, the contract's state is loaded from the storage and put into memory.
>
> The state is actually [stored serialized](https://docs.near.org/smart-contracts/anatomy/serialization.md), and the SDK takes a bit of time to deserialize it before the method can access it.
>
> When the method finishes executing successfully, all the changes to the state are serialized, and saved back to the storage.

> [!WARNING]
>
> **State and Code**
>
> In NEAR, the contract's code and contract's storage are **independent**.
>
> Updating the code of a contract does **not erase** the state, and can indeed lead to unexpected behavior or errors.
>
> Make sure to read the [updating a contract](https://docs.near.org/smart-contracts/release/upgrade.md) if you run into issues.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.