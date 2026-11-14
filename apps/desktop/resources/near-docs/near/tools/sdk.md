> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Rust SDK

> The Rust SDK for building smart contracts.

NEAR's only official smart-contract SDK is [near-sdk-rs](https://github.com/near/near-sdk-rs), the NEAR SDK for Rust. It provides APIs for contract state, serialization, cross-contract calls, and the NEAR runtime.

> [!TIP]
>
> The best place to start learning is our [QuickStart Guide](https://docs.near.org/smart-contracts/quickstart.md).

> [card] [Rust SDK](https://docs.rs/near-sdk/latest/near_sdk/)
>
> Rust SDK reference documentation.

## Smart contracts on NEAR

This is how a smart contract written in Rust using the NEAR SDK looks like:

```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[near(contract_state)]
pub struct Contract {
    greeting: String,
}

impl Default for Contract {
    fn default() -> Self {
        Self { greeting: "Hello".to_string(), }
    }
}

#[near]
impl Contract {
    pub fn get_greeting(&self) -> String {
        self.greeting.clone()
    }

    pub fn set_greeting(&mut self, greeting: String) {
        self.greeting = greeting;
    }
}
```

## Ready to start developing?

Start from our [Smart Contract QuickStart Guide](https://docs.near.org/smart-contracts/quickstart.md), and let it guide you through all our documentation on building smart contracts.

## Want to see examples?

We have a section dedicated to [tutorials and examples](https://docs.near.org/smart-contracts/tutorials/basic-contracts.md) that will help you understand diverse use cases and how to implement them.

## Reference docs

If you need to find a specific function signature, or understand the SDK structs and classes, visit the [Rust SDK reference](https://docs.rs/near-sdk/latest/near_sdk/).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.