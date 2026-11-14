> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Basic Anatomy

> Learn the basic anatomy of all smart contracts.

Let's illustrate the basic anatomy of a simple "Hello World" contract. The code on this page comes from our [Hello NEAR repository](https://github.com/near-examples/hello-near-examples) on GitHub.

## Importing the SDK

All contracts will import the **NEAR SDK**, enabling them to [access the execution environment](https://docs.near.org/smart-contracts/anatomy/environment.md), [call other contracts](https://docs.near.org/smart-contracts/anatomy/crosscontract.md), [transfer tokens](https://docs.near.org/smart-contracts/anatomy/actions.md), and much more.

You can also use third-party libraries, though some might not work due to the limitations of the contract runtime.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
use near_sdk::{log, near};
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L2-L2)

## Contract's Main Structure

The contract is described through a structure:

* The attributes define which data the contract stores
* The functions define its public (and private) interface

Note that the contract's struct definition and the implementation are decorated with macros

The `#[near(contract_state)]` macro tells the SDK that this structure defines the contract's state, so it knows:

1. What to fetch from storage when the contract is loaded
2. What to store when the contract is done executing

The `#[near]` macro tells the SDK which functions are exposed to the outside world.

> [!NOTE]
>
> Only one struct can be decorated with the `#[near(contract_state)]` macro.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[near(contract_state)]
pub struct Contract {
    greeting: String,
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L5-L8)

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[near]
impl Contract {
    // Public method - returns the greeting saved, defaulting to DEFAULT_GREETING
    pub fn get_greeting(&self) -> String {
        self.greeting.clone()
    }

    // Public method - accepts a greeting, such as "howdy", and records it
    pub fn set_greeting(&mut self, greeting: String) {
        log!("Saving greeting: {}", greeting);
        self.greeting = greeting;
    }
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L20-L32)

> [accordion] Interaction with other macros
>
> When `near` is built for the wasm32 target, it generates the external NEAR contract bindings.  To achieve this it is actually generating another function with the signature `pub extern "C" fn function_name()` that first deserializes the contract struct from NEAR storage and then calls the `contract.function_name(parameter1, parameter2, ...)`.
>
> If you have annotated your function with any attribute-like macros, these are then executed *twice*.  Specifically if the attribute like macro makes any modification to the function signature, or inserts any code that depends on the contract struct (in the form of `&self`, `&mut self`, or `self`) this will fail in the second invocation, because the externally exposed function does not have any concept of this struct.
>
> It is possible to detect this by checking which build target you are building for and limit the execution of the macro to operate only on the first pass.

## Storage (State)

We call the data stored in the contract [the contract's state](https://docs.near.org/smart-contracts/anatomy/storage.md).

In our Hello World example, the contract stores a single string (`greeting`), and the state starts initialized with the default value `"Hello"`.

> [!NOTE]
>
> We will cover more about the contract's state in the [state section](https://docs.near.org/smart-contracts/anatomy/storage.md).

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
pub struct Contract {
    greeting: String,
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L6-L8)

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

## Read Only Functions

Contract's functions can be read-only, meaning they don't modify the state. Calling them is free for everyone, and does not require to have a NEAR account.

> [!NOTE]
>
> We will cover more about function types in the [functions section](https://docs.near.org/smart-contracts/anatomy/functions.md).

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
// Public method - returns the greeting saved, defaulting to DEFAULT_GREETING
pub fn get_greeting(&self) -> String {
    self.greeting.clone()
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L22-L25)

## State Mutating Functions

Functions that modify the state or call other contracts are considered state mutating functions. It is necessary to have a NEAR account to call them, as they require a transaction to be sent to the network.

> [!NOTE]
>
> We will cover more about function types in the [functions section](https://docs.near.org/smart-contracts/anatomy/functions.md).

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
// Public method - accepts a greeting, such as "howdy", and records it
pub fn set_greeting(&mut self, greeting: String) {
    log!("Saving greeting: {}", greeting);
    self.greeting = greeting;
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/contract-rs/src/lib.rs#L27-L31)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.