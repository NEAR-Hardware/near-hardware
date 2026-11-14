> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Production Builds

> Reduce contract size and create reproducible builds that users can verify against the deployed code.

In this page, we will explore strategies for reducing the size of smart contracts on NEAR. This is particularly useful for developers who want to optimize their contracts for deployment, especially in scenarios where contract size limits are a concern.

# Reducing a contract's size

## Advice & examples

This page is made for developers familiar with lower-level concepts who wish to reduce their contract size significantly, perhaps at the expense of code readability.

Some common scenarios where this approach may be helpful:

* contracts intended to be tied to one's account management
* contracts deployed using a factory
* future advancements similar to the EVM on NEAR

There have been a few items that may add unwanted bytes to a contract's size when compiled. Some of these may be more easily swapped for other approaches while others require more internal knowledge about system calls.

## Small wins

### Using flags

When compiling a contract make sure to pass flag `-C link-arg=-s` to the rust compiler:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
```

Here is the parameters we use for the most examples in `Cargo.toml`:

```toml theme={"theme":{"light":"github-light","dark":"github-dark"}}
[profile.release]
codegen-units = 1
opt-level = "s"
lto = true
debug = false
panic = "abort"
overflow-checks = true
```

You may want to experiment with using `opt-level = "z"` instead of `opt-level = "s"` to see if generates a smaller binary. See more details on this in [The Cargo Book Profiles section](https://doc.rust-lang.org/cargo/reference/profiles.html#opt-level). You may also reference this [Shrinking .wasm Size](https://rustwasm.github.io/book/reference/code-size.html#tell-llvm-to-optimize-for-size-instead-of-speed) resource.

### Removing `rlib` from the manifest

Ensure that your manifest (`Cargo.toml`) doesn't contain `rlib` unless it needs to. Some NEAR examples have included this:

> [!WARNING]
>
> **Adds unnecessary bloat**
>
> ```toml theme={"theme":{"light":"github-light","dark":"github-dark"}}
> [lib]
> crate-type = ["cdylib", "rlib"]
> ```

when it could be:

> [!TIP]
>
> ```toml theme={"theme":{"light":"github-light","dark":"github-dark"}}
> [lib]
> crate-type = ["cdylib"]
> ```

3. When using the Rust SDK, you may override the default JSON serialization to use [Borsh](https://borsh.io) instead. See [overriding interface serialization](https://docs.near.org/smart-contracts/anatomy/serialization.md#overriding-interface-serialization) for more information and an example.
4. When using assertions or guards, avoid using the standard `assert` macros like [`assert!`](https://doc.rust-lang.org/std/macro.assert.html), [`assert_eq!`](https://doc.rust-lang.org/std/macro.assert_eq.html), or [`assert_ne!`](https://doc.rust-lang.org/std/macro.assert_ne.html) as these may add bloat for information regarding the line number of the error. There are similar issues with `unwrap`, `expect`, and Rust's `panic!()` macro.

Example of a standard assertion:

> [!WARNING]
>
> **Adds unnecessary bloat**
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> assert_eq!(contract_owner, predecessor_account, "ERR_NOT_OWNER");
> ```

when it could be:

> [!TIP]
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> if contract_owner != predecessor_account {
>   env::panic(b"ERR_NOT_OWNER");
> }
> ```

Example of removing `expect`:

> [!WARNING]
>
> **Adds unnecessary bloat**
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> let owner_id = self.owner_by_id.get(&token_id).expect("Token not found");
> ```

when it could be:

> [!TIP]
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> fn expect_token_found<T>(option: Option<T>) -> T {
>   option.unwrap_or_else(|| env::panic_str("Token not found"))
> }
> let owner_id = expect_token_found(self.owner_by_id.get(&token_id));
> ```

Example of changing standard `panic!()`:

> [!WARNING]
>
> **Adds unnecessary bloat**
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> panic!("ERR_MSG_HERE");
> ```

when it could be:

> [!TIP]
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> env::panic_str("ERR_MSG_HERE");
> ```

## Ready to use script

We have prepared a simple `bash` script that can be used to minify `.wasm` contract file. You can find it [here](https://github.com/near/near-sdk-rs/blob/master/minifier/minify.sh).

The current approach to minification is the following:

1. Snip (i.e. just replace with unreachable instruction) few known fat functions from the standard library (such as float formatting and panic-related) with `wasm-snip`.
2. Run `wasm-gc` to eliminate all functions reachable from the snipped functions.
3. Strip unneeded sections, such as names with `wasm-strip`.
4. Run `binaryen wasm-opt`, which cleans up the rest.

### Requirements to run the script:

* install [wasm-snip](https://docs.rs/wasm-snip/0.4.0/wasm_snip/) and [wasm-gc](https://docs.rs/crate/wasm-gc/0.1.6) with Cargo:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
cargo install wasm-snip wasm-gc
```

* install [binaryen](https://github.com/WebAssembly/binaryen) and [wabt](https://github.com/WebAssembly/wabt) on your system. For Ubuntu and other Debian based Linux distributions run:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
apt install binaryen wabt
```

> [!CAUTION]
>
> Minification could be rather aggressive, so you must test the contract after minification. Standalone NEAR runtime could be helpful [here](https://github.com/nearprotocol/nearcore/tree/master/runtime/near-vm-runner).

## Lower-level approach

For a `no_std` approach to minimal contracts, observe the following examples:

* [Tiny contract](https://github.com/near/nearcore/tree/1e7c6613f65c23f87adf2c92e3d877f4ffe666ea/runtime/near-test-contracts/tiny-contract-rs)
* [NEAR ETH Gateway](https://github.com/ilblackdragon/near-eth-gateway/blob/master/proxy/src/lib.rs)
* [This YouTube video](https://youtu.be/Hy4VBSCqnsE) where Eugene demonstrates a fungible token in `no_std` mode. The code for this [example lives here](https://github.com/near/core-contracts/pull/88).
* [Examples using a project called `nesdie`](https://github.com/austinabell/nesdie/tree/main/examples).
* Note that Aurora has found success using [rjson](https://crates.io/crates/rjson) as a lightweight JSON serialization crate. It has a smaller footprint than [serde](https://crates.io/crates/serde) which is currently packaged with the Rust SDK. See [this example of rjson](https://github.com/aurora-is-near/aurora-engine/blob/65a1d11fcd16192cc1bda886c62005c603189a24/src/json.rs#L254) in an Aurora repository, although implementation details will have to be gleaned by the reader and won't be expanded upon here. [This nesdie example](https://github.com/austinabell/nesdie/blob/bb6beb77e32cd54077ac54bf028f262a9dfb6ad0/examples/multisig/src/utils/json/vector.rs#L26-L30) also uses the [miniserde crate](https://crates.io/crates/miniserde), which is another option to consider for folks who choose to avoid using the Rust SDK.

> [!NOTE]
>
> **Information on system calls**
>
> The [`near_sys` crate](https://docs.rs/near-sys/latest/near_sys/) exposes the low-level host functions available to contracts that interact directly with the runtime. See its reference for function signatures.
>
> The SDK's [`env` module](https://github.com/near/near-sdk-rs/blob/2728185be188fd2975dd9ce0a77012638c36cab4/near-sdk/src/environment/env.rs) provides higher-level wrappers around these functions.

***

## Reproducible builds

Reproducible builds let different people build the same program and get the exact same output. They help users verify that a deployed contract corresponds to its published source code.

Building the same contract on different machines can produce similar but non-identical binaries because the artifact can be affected by the locale, timezone, build path, and other parts of the build environment. NEAR addresses this with [NEP-330 source metadata](https://github.com/near/NEPs/blob/master/neps/nep-0330.md), [cargo-near](https://github.com/near/cargo-near), Docker, and SourceScan.

> [!NOTE]
>
> You need [Docker](https://docker.com) to use the reproducible-build workflow.

When you initialize a project with `cargo near new`, its `Cargo.toml` includes the build environment and repository metadata:

```toml theme={"theme":{"light":"github-light","dark":"github-dark"}}
repository = "https://github.com/<organization>/<repository>"

[package.metadata.near.reproducible_build]
image = "sourcescan/cargo-near:0.13.5-rust-1.85.1"
image_digest = "sha256:3b0272ecdbb91465f3e7348330d7f2d031d27901f26fb25b4eaf1560a60c20f3"
passed_env = []
container_build_command = [
    "cargo",
    "near",
    "build",
    "non-reproducible-wasm",
    "--locked",
]
```

When you deploy with `cargo near deploy`, this information is used to clone the repository and compile the contract in a Docker container. The build adds a `contract_source_metadata` method without changing the contract's logic.

After deployment, inspect that metadata with:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near view <contract-account> contract_source_metadata
```

## Verify and publish

To verify and publish the contract's code, open its account page in [NearBlocks](https://nearblocks.io), select the **Contract** tab, and use **Verify and Publish**. After verification, the source and metadata are available under **Contract → Contract Code**.

![NearBlocks interface for verifying a reproducible contract build](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/smart-contracts/reproducible-build.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=06b03d8bd746ffc721e0c0cd7327e16e)

For a complete walkthrough, see the [SourceScan verification guide](https://github.com/SourceScan/verification-guide).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.