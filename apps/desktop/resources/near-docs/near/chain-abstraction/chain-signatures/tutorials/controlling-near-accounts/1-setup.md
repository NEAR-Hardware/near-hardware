> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting up a Near account to be controlled by MPC

> Set up a NEAR account to be securely controlled via MPC by deriving a public key and adding it as an access key.

One of the powerful features of the NEAR Protocol is its flexible [access keys architecture](https://docs.near.org/protocol/accounts-contracts/access-keys.md). An account can hold multiple access keys, each with different levels of permission. This enables us to grant transaction-signing capabilities to an external key without compromising security.

To achieve secure external control via MPC, we must derive a valid `secp256k1` public key from the MPC smart contract. This key belongs to a key pair that will be used later in the tutorial for signing transactions securely.

Before we proceed, let's create an account on whose behalf we will be acting.

## Creating an account

If you already have a NEAR account that you want to control via MPC, feel free to skip this step.
Otherwise, use the following command:

```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
near account create-account fund-myself
```

## Deriving a Public Key from MPC

As you already know from the [Chain Signatures documentation](https://docs.near.org/chain-abstraction/chain-signatures.md#how-it-works), `derivation_path` is the key component that allows generating multiple distinct key pairs. When combined with `predecessor_id`, it forms a unique and secure pair.

In our example, the smart contract acts as a proxy between a user and the MPC, `User Account <->  Contract Proxy <-> Contract Requesting a Signature`, which means the contract itself becomes the `predecessor` in the derivation process: `predecessor: contract_proxy_address`.

If the Contract Proxy were deployed directly onto the User Account,  `User Account <-> Contract Requesting a Signature`, the User Account would become the `predecessor` in the derivation process: `predecessor: user_account_address`.

To understand how `derivation_path` is built, let's examine the [smart contract implementation](https://github.com/nearuaguild/control-near-account-with-mpc-example/blob/97883851483c05d4c9206afb6efeac02ec9c2541/contract/src/lib.rs#L64-L68):

```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
let derivation_path = format!(
    "{}-{}",
    env::predecessor_account_id().to_string(),
    args.signer_id.to_string()
);
```

* `args.signer_id` is the account on whose behalf we're acting
* `env::predecessor_account_id().to_string()` refers to the account that is calling the contract, please do not confuse it with previously mentioned `predecessor_id` as it refers to the smart contract address

Now that we understand how each input is calculated, let's put them together and actually derive a public key.

> [tab] TypeScript
>
> ```ts theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const contractId = "broken-rock.testnet"; // smart contract address
> const adminAccountId = "admin.testnet"; // signs transactions to act on behalf of `controllableAccountId`
> const controllableAccountId = "controllable.testnet"; // on whose behalf we'll be acting
>
> // admin.testnet-controllable.testnet
> const derivationPath = `${adminAccountId}-${controllableAccountId}`;
>
> // secp256k1:m2CUiQw9f5nN8sAszkHrbok6apRz7j6LkpFZ6vT6zzxLHh2C54udU9Ue7eRy7FRK42pD796nNSwEdsqXzLb96PR
> const derivedPublicKey = await deriveKey(contractId, derivationPath);
> ```

## Adding key to the account

Once we have the public key, the final step is to add it to the NEAR account.

> [tab] Near CLI
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near account add-key controllable.testnet grant-full-access use-manually-provided-public-key secp256k1:m2CUiQw9f5nN8sAszkHrbok6apRz7j6LkpFZ6vT6zzxLHh2C54udU9Ue7eRy7FRK42pD796nNSwEdsqXzLb96PR network-config testnet sign-with-legacy-keychain send
> ```

> [tab] TypeScript
>
> ```ts theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const path = require("node:path");
> const { homedir } = require("node:os");
> const { keyStores, connect } = require("near-api-js");
>
> const CREDENTIALS_DIR = ".near-credentials";
> const credentialsPath = path.join(homedir(), CREDENTIALS_DIR);
> const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
>
> const config = {
>   keyStore,
>   networkId: "testnet",
>   nodeUrl: "https://rpc.testnet.near.org",
> };
>
> const near = await connect(config);
>
> const account = await near.account("controllable.testnet");
>
> // uses derivedPublicKey from previous step
> await account.addKey(derivedPublicKey);
> ```

In our example, we’ve added this public key as a [**FullAccess key**](https://docs.near.org/protocol/accounts-contracts/access-keys.md#full-access-keys), meaning it has full control over the account, this allows us to execute all transactions without limitations. However, it is also possible to add the key as a **FunctionCall access key** with limited permissions.

The next step is to create, sign and eventually send a transfer transaction on behalf of `controllable.testnet`. Continue to [the next chapter](https://docs.near.org/chain-abstraction/chain-signatures/tutorials/controlling-near-accounts/2-transfer.md) to learn how.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.