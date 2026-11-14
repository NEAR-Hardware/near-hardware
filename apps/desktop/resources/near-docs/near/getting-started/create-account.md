> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Create an Account

> Understand how to create a NEAR account using a wallet and the NEAR CLI

A NEAR `testnet` account allows you to deploy contracts and log in to Web3 apps without spending any real money. You can create a `testnet` NEAR account through one of the following methods:

> [card] [Using one of the wallets listed in wallet.near.org](#using-a-wallet)

> [card] [Using the command line interface (CLI)](#through-the-cli)

> [!TIP]
>
> You do not need an account to start building: test smart contracts locally using [NEAR Sandbox](https://docs.near.org/smart-contracts/testing/integration-test.md) and the frontend through [a local network](https://docs.near.org/web3-apps/tutorials/localnet/run.md).

> [!NOTE]
>
> If you already have a NEAR account, you can import it into another wallet or the CLI. See [Importing Existing Accounts](#importing-existing-accounts) below.

***

## Using a Wallet

Go to [wallet.near.org](https://wallet.near.org/) and choose one of the wallets listed there. Do not worry, the list has been curated, so you can be sure that all wallets listed there are safe to use.

In general, all wallets will offer similar functionality, so in theory you can choose any of them. However, know that some wallets will readily allow you to create [named accounts](https://docs.near.org/protocol/accounts-contracts/account-id.md#named-address) (e.g. `alice.testnet`), which are easier to remember.

Remember to write down the seed phrase, as it is the only way to access your account!

> [!WARNING]
>
> **Testnet**
> Make sure to create a `testnet` account (ending with `.testnet`, e.g. `alice.testnet`), and not a `mainnet` account (ending with `.near`).
>
> NEAR `testnet` is a separate network that allows you to test your applications without spending real money.

> [!TIP]
>
> **Funding the Wallet**
>
> Need `testnet` funds? try using one of our [faucets](https://docs.near.org/getting-started/faucet.md)

***

## Through the CLI

When developing smart contracts you will expend lots of time interacting with the NEAR blockchain through the command line interface (CLI).

First, you will need to install the [NEAR CLI](https://docs.near.org/tools/cli.md#installation):

> [tab] npm
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install -g near-cli-rs@latest
> ```

> [tab] Homebrew
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> brew install near
> ```

> [tab] Cargo
>
> ```
> $ cargo install near-cli-rs
> ```

> [tab] Mac and Linux (binaries)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh
> ```

> [tab] Windows (binaries)
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> irm https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.ps1 | iex
> ```

Once you have the CLI installed, you can create a new account using the following command:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near create-account <account.testnet> --useFaucet
```

This command will create a new account with the name `<account.testnet>` and fund it using the `testnet` faucet. Make sure to replace `<account.testnet>` with your desired account name.

***

## Importing Existing Accounts

If you want to use an existing NEAR account in another wallet or in the CLI, you can import it using your seed phrase or private key.

> [accordion] 1. Export your seed phrase or private key
>
> From your current wallet, use its account backup/export flow.
>
> If the account was created with the CLI, run:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near account export-account <account.testnet>
> ```

> [accordion] 2. Import into a wallet
>
> In your destination wallet, choose the account import/restore option and provide your seed phrase.

> [accordion] 3. Import into the CLI
>
> Run:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near account import-account
> ```
>
> Then follow the prompts to enter your seed phrase or private key.

> [!WARNING]
>
> Keep your seed phrase and private key secure. Anyone with access to them can control your account.

***

## Next Steps

Now that you have created a NEAR account, you can start developing applications on the NEAR Protocol.

Here are some resources to help you get started:

* Fund the wallet through one of our [faucets](https://docs.near.org/getting-started/faucet.md)
* Create your [first smart contract](https://docs.near.org/smart-contracts/quickstart.md)
* Build a [Web3 Application](https://docs.near.org/web3-apps/quickstart.md)
* Learn how to build an [Auction App from end-to-end](https://docs.near.org/web3-apps/tutorials/mastering-near/0-intro.md)
* Not sure where to begin? Check [Start Building](https://docs.near.org/getting-started/start-building.md)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.