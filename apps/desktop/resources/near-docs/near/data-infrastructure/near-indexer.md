> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# What is NEAR Indexer?

> A framework to handle real-time events on the blockchain

As scaling dApps enter NEAR’s mainnet, an issue may arise: how do they quickly and efficiently access state from our deployed smart contracts, and cut out the cruft? Contracts may grow to have complex data structures and querying the network RPC may not be the optimal way to access state data.

The [NEAR Indexer](https://github.com/near/nearcore/tree/master/chain/indexer) is a micro-framework specifically designed to handle real-time events on the blockchain, allowing to capture and index streams of blocks in a customized manner.

With the NEAR Indexer, developers can perform both high-level data aggregation and low-level introspection of blockchain events.

> [!TIP]
>
> To ingest blocks without operating a NEAR node, use [Neardata](https://docs.fastnear.com/neardata) as the data source for your indexer.

***

## How It Works

The NEAR Indexer works by **running a node** and processing blocks as they are added to the blockchain. The framework provides a stream of blocks, allowing developers to subscribe and process these blocks in real-time.

> [!TIP]
>
> Learn how to run it following the [tutorial](https://docs.near.org/data-infrastructure/tutorials/near-indexer.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.