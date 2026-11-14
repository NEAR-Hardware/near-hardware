> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Nodes & RPC

> Node configuration, archival history, health checks, and network upgrades for exchange integrations.

NEAR nodes provide RPC access to the network: exchanges use them to query balances, read blocks and receipt outcomes, and submit transactions.

There are two types of RPC nodes: regular and archival.

A [regular RPC node](https://near-nodes.io/rpc) keeps approximately 36 hours of history - 5 epochs of the NEAR blockchain, meanwhile, archival RPC nodes preserve older blocks, and account states for queries at earlier blocks.

Exchanges can operate a regular RPC node and use its own archival node or an archival RPC provider for older data.

| Capability | Regular RPC node | Archival RPC node |
| - | - | - |
| Current balances and transaction submission | Supported | Supported |
| Blocks, outcomes, and state queries at earlier heights | Last \~36 hours by default | From genesis when initialized with a complete archive |
| History retention | 5 epochs (\~36 hours) by default; configurable | All history retained in the archive |
| Recommended mainnet storage | 4 TB NVMe SSD | 3 TB hot SSD + 115 TB cold disk; grows over time |
| Exchange use cases | Deposit monitoring, withdrawals, current balance checks | Backfilling deposits, investigating older transactions, reconciliation at earlier blocks |

Storage recommendations: [RPC hardware](https://near-nodes.io/rpc/hardware-rpc) · [Archival hardware](https://near-nodes.io/archival/hardware-archival).

***

## Regular RPC Node

A regular RPC node provides a gateway for day-to-day exchange operations. Use it to:

* Read finalized blocks and receipt outcomes to monitor incoming deposits.
* Submit withdrawals and track their execution.
* Query current native and fungible-token balances for reconciliation.

### Resources

* [Hardware requirements and history retention](https://near-nodes.io/rpc/hardware-rpc)
* [Set up and run an RPC node](https://near-nodes.io/rpc)
* [Bootstrap with Epoch Sync](https://near-nodes.io/intro/node-epoch-sync)

***

## Archival Node

An archival RPC node provides past blocks, transaction and receipt outcomes, and account and contract states. Use it to:

* Backfill deposits after downtime that exceeds a regular RPC node's retention window.
* Investigate older deposits, withdrawals, and their receipt chains.
* Query native or fungible-token balances at older block heights for reconciliation.

### Resources

* [Set up and run a split-storage archival node](https://near-nodes.io/archival/split-storage-archival)
* [Archival hardware requirements](https://near-nodes.io/archival/hardware-archival)

***

## Running Private Nodes

Exchanges running RPC nodes can reduce public exposure and unsolicited peer connections by restricting RPC access and disabling inbound peering. This setup ensures that only authorized applications or nodes can interact with the RPC node, thus enhancing security.

RPC access and peering are configured separately. Add the relevant settings below into the node's `config.json`, then restart `neard`.

### Private RPC Access

Bind RPC to the loopback interface to prevent direct access from other hosts:

```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
{
  "rpc": {
    "addr": "127.0.0.1:3030"
  }
}
```

For applications on other hosts, bind RPC to a private interface and restrict access through a firewall or VPN.

### Outbound-only Peering

A node can initiate its ordinary peer connections and exchange blocks and transactions over those connections. Disable inbound connections from ordinary peers with:

```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
{
  "network": {
    "experimental": {
      "inbound_disabled": true
    }
  }
}
```

NEAR nodes accept inbound peer connections on TCP port `24567` by default - configured through `network.addr`. Once your node is synchronized, you can close this port in the firewall while keeping `inbound_disabled: true`.

### State Sync Caveats

Nodes can follow the chain and catch up over outbound peer connections (i.e. `inbound_disabled: true`) while the inbound peering port is closed.

However, if your node is too far behind, you can open the inbound peering port temporarily to allow incoming connections and catch up more efficiently.

Open the port and follow the [Epoch Sync setup](https://near-nodes.io/intro/node-epoch-sync) to refresh `network.boot_nodes` before starting `neard`. Once synchronization completes, you can close the peering port to new inbound connections again.

> [accordion] State Sync on Archival Nodes
>
> Archival nodes download and process missing blocks instead of using Epoch Sync and state sync to skip ahead. They can use outbound-only peering, but need peers that retain the missing history. Recovery after extended downtime can be slow. Follow [archival setup](https://near-nodes.io/archival/split-storage-archival) for storage configuration and historical data requirements.

***

## Frequently Asked Questions

> [accordion] Can regular and archival RPC nodes run with inbound peering disabled?
>
> Yes. Set `network.experimental.inbound_disabled` to `true` and restrict RPC access separately. Regular nodes need inbound connectivity for peer state sync during setup or recovery after falling far behind. Archival nodes process missing blocks and need peers that retain that history. See [Running Private Nodes](#running-private-nodes) for configuration and recovery caveats.

> [accordion] Can a node be configured to archive all blockchain data since genesis?
>
> Yes, with an archival configuration and a complete history source. The run flag is:
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> ./target/release/neard run --archive
> ```
>
> Follow [split-storage archival setup](https://near-nodes.io/archival/split-storage-archival) for the network and supported node version. The flag preserves history as the node processes it; it does not restore data missing from an existing pruned database. Epoch Sync and state sync do not provide a complete archive.

> [accordion] Can a node be configured to expose an RPC (ex: HTTP) interface?
>
> Yes. JSON-RPC can be enabled or disabled; configure its listening address with `rpc.addr` in the node's `config.json` file.

> [accordion] Can a node be gracefully terminated and restarted (using archived data on disk to continue syncing)?
>
> Yes.

> [accordion] Does a node expose an interface for retrieving health telemetry in a structured format (ex: JSON) over RPC?
>
> Yes. `GET /status` and `GET /health` provide this interface.
>
> * `/status`: node version, block context, and syncing status. Use [network RPC](https://docs.near.org/api/rpc/introduction.md) for peer information.
> * `/health`: success/failure if node is up running & progressing

> [accordion] Can a node be started using a Dockerfile without human supervision?
>
> Yes. Use a supported `neard` release or container image, persist the node’s home and storage volumes, and supply the network’s genesis and configuration. Pin the release and follow [node operation guidance](https://near-nodes.io/).

> [accordion] What is the source of truth for current block height exposed via API?
>
> * MainNet
>   * [https://nearblocks.io](https://nearblocks.io)
>   * `https://rpc.mainnet.near.org/status`
> * TestNet
>   * [https://testnet.nearblocks.io](https://testnet.nearblocks.io)
>   * `https://rpc.testnet.near.org/status`

> [accordion] How can I quickly sync a node?
>
> For regular RPC nodes, follow the [Epoch Sync setup](https://near-nodes.io/intro/node-epoch-sync), then let the node download recent state through peer state sync. Archival nodes require the [archival setup](https://near-nodes.io/archival/split-storage-archival).

> [accordion] What is the network upgrade process?
>
> Nodes signal supported protocol versions, and upgrades activate according to the protocol upgrade rules. Normal upgrades preserve the chain’s genesis and history. Follow supported node releases and test your integration before an activation boundary.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.