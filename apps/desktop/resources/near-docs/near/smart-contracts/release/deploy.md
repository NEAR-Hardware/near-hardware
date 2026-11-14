> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Deploying

> Deploy a contract to the network.

After your contract is ready you can deploy it in the NEAR network for everyone to use it.

Let us guide you on how to use the [NEAR CLI](https://docs.near.org/tools/cli.md) to deploy your contract
and call its methods.

> [!NOTE]
>
> On this page, we will only cover the basics of NEAR CLI. For more information visit the
> [NEAR CLI documentation page](https://docs.near.org/tools/cli.md).

***

## Deploying the Contract

Thanks to the `NEAR CLI` deploying a contract is as simple as:

1. Compiling the contract to wasm.
2. [Create an account](https://docs.near.org/tools/cli.md#create) and [deploy the contract](https://docs.near.org/tools/cli.md#deploy) into it using `NEAR CLI`.

### Compile the Contract

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
cargo near build
```

### Create an Account and Deploy

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
# Create a new account pre-funded by a faucet
near create-account <accountId> --useFaucet

# deploy the contract
near deploy <accountId> <route_to_wasm>
```

### Deploy in an Existing Account

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
# login into your account
near login

# deploy the contract
near deploy <accountId> <route_to_wasm>
```

> [!TIP]
>
> You can overwrite a contract by deploying another on top of it. In this case, the account's logic
> will change, but the state will persist

> [!NOTE]
>
> By default `near-cli` uses the `testnet` network. Define `NEAR_ENV=mainnet` to deploy into `mainnet`.

> [!NOTE]
>
> **Naming Convention for Public-Facing Methods**
> Once the contract is deployed to the network, anyone and any other contract (i.e., any other account on NEAR) can interact with it by calling its methods. Furthermore, any transactions involving the contract will also be included in the network's data stream, which means its activity can also be visible to any who listens to particular events.
>
> Considering this, we advise to name methods using `snake_case`, which is the convention across the NEAR ecosystem.

***

## Initializing the Contract

If your contract has an [initialization method](https://docs.near.org/smart-contracts/anatomy/storage.md) you can call it to
initialize the state. This is not necessary if your contract implements `default` values for the state.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
# Call the initialization method (`init` in our examples)
near call <contractId> <initMethod> [<args>] --useAccount <accountId>
```

> [!NOTE]
>
> You can initialize your contract [during deployment](#deploying-the-contract) using the `--initFunction` & `--initArgs` arguments.

***

## Calling the Contract

Once your contract is deployed you can interact with it right away using [NEAR CLI](https://docs.near.org/tools/cli.md).

***

### View methods

View methods are those that perform **read-only** operations. Calling these methods is free, and do not require to specify which account is being used to make the call:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near view <contractId> <methodName>
```

> [!TIP]
>
> View methods have by default 200 TGAS for execution

***

### Change methods

Change methods are those that perform both read and write operations. For these methods we do need to specify the account being used to make the call,
since that account will expend GAS in the call.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near call <contractId> <methodName> <jsonArgs> --useAccount <yourAccount> [--deposit <amount>] [--gas <GAS>]
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.