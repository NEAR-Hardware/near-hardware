> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Controlling a NEAR account

> Learn to control a NEAR account securely using Multi-Party Computation.

Imagine acting on behalf of another Near account - without ever holding its private key. Sounds futuristic? It’s possible today, thanks to [Chain Abstraction and Multi-Party Computation (MPC)](https://docs.near.org/chain-abstraction/what-is.md), and this tutorial will walk you step-by-step through the entire process of transferring 0.1 NEAR on behalf of another Near account.

## How It Works

Behind the scenes, a smart contract constructs a valid transaction on behalf of a user and forwards it to an MPC contract for signing.

The key advantage of this approach is that no single entity possesses the private key — ensuring enhanced security and decentralization.

> [!NOTE]
>
> The complete source code for the smart contract used in this tutorial, along with scripts for playground simulation, is available in the [GitHub repository](https://github.com/nearuaguild/control-near-account-with-mpc-example).
>
> The contract is rolled out on testnet at `broken-rock.testnet`, feel free to use it for your own purposes if you don't want to dig deeper into deploying it on your own.

## What You Will Learn

In this tutorial, you will learn how to:

* [Prepare Near account](https://docs.near.org/chain-abstraction/chain-signatures/tutorials/controlling-near-accounts/1-setup.md) to be fully controlled via MPC
* [Build a transfer transaction and get it signed](https://docs.near.org/chain-abstraction/chain-signatures/tutorials/controlling-near-accounts/2-transfer.md) in a smart contract
* [Broadcast a signed transaction](https://docs.near.org/chain-abstraction/chain-signatures/tutorials/controlling-near-accounts/2-transfer.md) into the network over RPC.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.