> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Handling NEAR Types

> Learn how to handle common data types when interacting with NEAR

When calling methods in a contract or receiving results from them, you will need to encode/decode parameters correctly. For this, it is important to know how the contracts encode timestamps, balances, and gas.

> [!NOTE]
>
> **Searching for Smart Contract Data Types?**
>
> Check the [Smart Contract SDK Types](https://docs.near.org/smart-contracts/anatomy/functions.md#sdk-types) section for more information on how to handle data types within smart contracts.

***

## Time

The block timestamp in a smart contract is encoded using nanoseconds (i.e. 19 digits: `1655373910837593990`).

> [tab] 🌐 Javascript
>
> `Date.now()` returns a timestamp in milliseconds (i.e 13 digits: `1655373910837`). Make sure to convert between milliseconds and nanoseconds to properly handle time variables.

> [tab] 🦀 Rust
>
> In Rust `std::time::SystemTime::now()` returns a `SystemTime` object. You can convert it to nanoseconds since UNIX\_EPOCH as follows:
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> use std::time::{SystemTime, UNIX_EPOCH};
> let start = SystemTime::now();
> let since_the_epoch = start.duration_since(UNIX_EPOCH)
>     .expect("Time went backwards");
> let in_nanoseconds = since_the_epoch.as_nanos();
> println!("Current time in nanoseconds since UNIX EPOCH: {}", in_nanoseconds);
> ```

***

## Deposits

Smart contracts handle NEAR amounts always using `yoctoNEAR` (1Ⓝ = 10^24yocto). This means that when interacting with contract's or the user's balance you will need to convert between NEAR and yoctoNEAR.

Under the hood, the network (and contracts) represent balances as `u128`, which are encoded as strings (since JSON cannot handle more than 52 bit integers).

Remember to **always** send amounts as `strings` (e.g. `"1000000000000000000000000"` for 1Ⓝ) and **never** as `number` (e.g. `1000000`). Consequently, convert amounts from `string` whenever you want to display them to the user.

> [tab] 🌐 Javascript
>
> In javascript, you can use the `near-api-js` library to convert between NEAR and yoctoNEAR:
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { NEAR } from '@near-js/tokens'
>
> const units = NEAR.fromDecimal('1.5') // 1.5Ⓝ
> console.log(units) // "1500000000000000000000000"
>
> const decimal = NEAR.fromUnits('1500000000000000000000000', 2)
> console.log(decimal) // 1.5
> ```

> [tab] 🦀 Rust
>
> In Rust you can directly use the `near_token` crate to convert between NEAR and yoctoNEAR:
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> use near_token::NearToken
>
> fn main() {
>     const TEN_NEAR: NearToken = NearToken::from_near(10);
>
>     assert_eq!(TEN_NEAR.to_string(), "10.00 NEAR");
>     assert_eq!(TEN_NEAR.as_near(), 10);
>     assert_eq!(TEN_NEAR.as_millinear(), 10000);
>     assert_eq!(TEN_NEAR.as_yoctonear(), 10000000000000000000000000);
>
>     let input_str = "0.123456 NEAR";
>     let input_near: NearToken = input_str.parse().unwrap();
>     assert_eq!(
>         input_near,
>         NearToken::from_yoctonear(123456000000000000000000)
>     );
>
> }
> ```

***

## Gas

When calling a contract method, you can specify how much gas you want to attach to the call. Within the network, the `Gas` is represented as a `u64`, which is encoded as a `string` (since JSON cannot handle more than 52 bit integers).

As a rule of thumb, functions that consume little computation can be called with `30 Tgas` or less, while more complex functions may require up to `1000 Tgas`.

> [tab] 🌐 Javascript
>
> In javascript there is no built-in library to handle gas units, but you can easily convert between them as follows:
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const TGAS = 1000000000000; // 1 Tgas = 10^12 gas units
>
> function toTgas(gas) {
>     return (gas * TGAS).toString();
> }
>
> function fromTgas(tgas) {
>     return (parseInt(tgas) / TGAS).toFixed(2);
> }
> ```

> [tab] 🦀 Rust
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> use near_gas::NearGas;
>
> fn main() {
>     let data = "12.657 tgas";
>
>     let near_gas: NearGas = data.parse().unwrap();
>
>     // Convert the value to the most precise "gas" unit
>     assert_eq!(near_gas.as_gas(), 12657000000000);
>     // Convert the value to "gigagas" unit
>     assert_eq!(near_gas.as_ggas(), 12657);
>
>     // Display Gas. It will print: "Here is 12.7 Tgas"
>     println!("Here is {}", near_gas);
>
>     // When `serde` feature is enabled, NearGas can be used in serde-serializable structs.
>     // NearGas will be serialized to a gas-precision u64 value encoded as string.
>     #[derive(serde::Serialize)]
>     struct FunctionCallDetails {
>         used_gas: NearGas,
>     }
>
>     let details = FunctionCallDetails { used_gas: near_gas };
>
>     assert_eq!(serde_json::to_string(&details).unwrap(), r#"{"used_gas":"12657000000000"}"#);
> }
> ```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.