> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Signing Transactions

> Learn how to sign transactions across multiple blockchains.

Chain signatures enable NEAR accounts, including smart contracts, to sign and execute transactions across many blockchain protocols.

This unlocks the next level of blockchain interoperability by giving ownership of diverse assets, cross-chain accounts, and data to a single NEAR account.

> [accordion] Supported Networks
>
> While you can sign transactions for any network using Eddsa or Ecdsa keys, each chain signs transactions differently.
>
> Our example implementation shows you how to sign transactions for: Bitcoin, Solana, Cosmos, XRP, Aptos, Sui and EVM networks (Ethereum, Base, BNB Chain, Avalanche, Polygon, Arbitrum, and more).

***

## Create a Chain Signature

There are five steps to create a Chain Signature:

1. [Deriving the Foreign Address](#1-deriving-the-foreign-address) - Derive the address that will be controlled on the target blockchain.
2. [Creating a Transaction](#2-creating-the-transaction) - Create the transaction or message to be signed.
3. [Requesting a Signature](#3-requesting-the-signature) - Call the NEAR MPC contract requesting it to sign the transaction.
4. [Formatting the Signature](#4-formatting-the-signature) - Format the signature from the MPC contract and add it to the transaction.
5. [Relaying the Signed Transaction](#5-relaying-the-signed-transaction) - Send the signed transaction to the destination chain for execution.

![chain-signatures](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/welcome-pages/chain-signatures-overview.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=506f121798ea7a7618296f1a1a811dd9)

*Diagram of a chain signature in NEAR*

The [chainsig.js](https://github.com/NearDeFi/chainsig.js) library provides a convenient interface for completing each of these steps. The frontend uses `@hot-labs/near-connect` for wallet connections and transaction signing, and `near-api-js` for NEAR queries. Its `NearProvider` exposes the connected account and `signAndSendTransactions` through the local `useNearWallet` hook.

> [!TIP]
>
> For building transactions inside of NEAR smart contracts written in Rust, you can use the [Omni Transaction](https://github.com/near/omni-transaction-rs) library to easily build transactions for different blockchains (like Bitcoin and Ethereum).

> [!NOTE]
>
> **MPC Contracts**
>
> There is an [MPC contract](https://github.com/near/mpc/tree/main/crates/contract) available on both `mainnet` and `testnet`:
>
> * Mainnet: `v1.signer`
> * Testnet: `v1.signer-prod.testnet`
>
> The live participant set and threshold are in `v1.signer`: see [The MPC network today](https://docs.near.org/chain-abstraction/chain-signatures.md#the-mpc-network-today).

***

## Chain Signatures Contract

To interact with the chain signatures library you first need to instantiate a `ChainSignaturesContract`.

```js title="config.js" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
export const SIGNET_CONTRACT = new contracts.ChainSignatureContract({
  networkId: NetworkId,
  contractId: MPC_CONTRACT,
});
```

[See code on GitHub](https://github.com/near-examples/near-multichain/blob/7e1c9f1a8f8cf641685076810a155f5fdfe05d92/src/config.js#L53-L56)

The `networkId` and `contractId` are set to the values specified in the previous section depending which network you are on.

***

## Chain Adapters

To interact with a specific chain, you need to instantiate the relevant `chainAdapter`.

> [tab] Ξ EVM
>
> ```js title="EVM.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const publicClient = useMemo(() => createPublicClient({
>   transport: http(rpcUrl),
> }), [rpcUrl]);
>
> const Evm = useMemo(() => new chainAdapters.evm.EVM({
>   publicClient,
>   contract: SIGNET_CONTRACT,
> }), [publicClient]);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/EVM.jsx#L40-L47)
>
> The EVM chain adapter takes the `ChainSignaturesContract` as an argument as well as `publicClient` which is constructed from an EVM RPC URL.
>
> > [!TIP]
> >
> > To use different EVM networks, simply specify the RPC URL for your desired network.
> > The example demonstrates compatibility with multiple EVM-compatible networks including Ethereum, Base, BNB Chain, Avalanche, Polygon, Arbitrum, zkSync, and many others.
> > You can find RPC URLs for various networks at [ChainList](https://chainlist.org/?testnets=true).

> [tab] ₿ Bitcoin
>
> ```js title="Bitcoin.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const btcRpcAdapter = new chainAdapters.btc.BTCRpcAdapters.Mempool(
>   "https://mempool.space/testnet4/api",
> );
>
> const Bitcoin = new chainAdapters.btc.Bitcoin({
>   network: NetworkId,
>   btcRpcAdapter,
>   contract: SIGNET_CONTRACT,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Bitcoin.jsx#L10-L18)
>
> The Bitcoin chain adapter takes the `ChainSignaturesContract` as an argument as well as the `network` ("mainnet", "testnet" or "regtest") and a `btcRpcAdapter` which handles communication with the Bitcoin network.

> [tab] ◎ Solana
>
> ```js title="Solana.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const connection = new SolanaConnection("https://api.devnet.solana.com");
>
> const Solana = new chainAdapters.solana.Solana({
>   solanaConnection: connection,
>   contract: SIGNET_CONTRACT,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Solana.jsx#L12-L17)
>
> The Solana chain adapter takes the `ChainSignaturesContract` as an argument as well as a `connection` which is constructed from a Solana RPC URL. If you want to use Mainnet, then you need to choose a Mainnet RPC.

> [tab] ◉ XRP
>
> ```js title="XRP.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const Xrp = new chainAdapters.xrp.XRP({
>   rpcUrl: "wss://s.altnet.rippletest.net:51233/",
>   contract: SIGNET_CONTRACT,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/XRP.jsx#L11-L14)
>
> The XRP chain adapter takes the `ChainSignaturesContract` as an argument as well as an `rpcUrl` for the XRP Ledger and the `rpcURl` specification. For testnet, use `https://s.altnet.rippletest.net:51234`.

> [tab] ◈ SUI
>
> ```js title="Sui.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rpcUrl = getFullnodeUrl("testnet");
> const suiClient = new SuiClient({ url: rpcUrl });
>
> const Sui = new chainAdapters.sui.SUI({
>   client: suiClient,
>   contract: SIGNET_CONTRACT,
>   rpcUrl: rpcUrl,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Sui.jsx#L13-L20)
>
> The SUI chain adapter takes the `ChainSignaturesContract` as an argument as well as a `connection` which is a SuiClient constructed from a SUI RPC URL.

> [tab] ⬟ Aptos
>
> ```js title="Aptos.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const aptosClient = new AptosClient(
>   new AptosConfig({
>     network: Network.TESTNET,
>   }),
> );
>
> const Aptos = new chainAdapters.aptos.Aptos({
>   client: aptosClient,
>   contract: SIGNET_CONTRACT,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Aptos.jsx#L12-L21)
>
> The Aptos chain adapter takes the `ChainSignaturesContract` as `contract` and an `AptosClient` as `client`. Configure the client with the Aptos network and node URL you want to use.

***

## 1. Deriving the Foreign Address

Chain Signatures use [`derivation paths`](../chain-signatures#derivation-paths-one-account-multiple-chains) to represent accounts on the target blockchain. The foreign address to be controlled can be deterministically derived from:

* The NEAR account calling the MPC contract (e.g., `example.near`, `example.testnet`, etc.)
* A derivation path (a string such as `ethereum-1`, `ethereum-2`, etc.)
* The MPC service's master public key (we don't need to worry about this as it is defined in the library we're using).

To derive the address call the `deriveAddressAndPublicKey` method passing the near account Id from which the address is being derived and the derivation path.

> [tab] Ξ EVM
>
> ```js title="EVM.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { address } = await Evm.deriveAddressAndPublicKey(signedAccountId, debouncedDerivationPath);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/EVM.jsx#L92-L92)

> [tab] ₿ Bitcoin
>
> ```js title="Bitcoin.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { address, publicKey } = await Bitcoin.deriveAddressAndPublicKey(
>   signedAccountId,
>   debouncedDerivationPath,
> );
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Bitcoin.jsx#L49-L52)

> [tab] ◎ Solana
>
> ```js title="Solana.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { publicKey } = await Solana.deriveAddressAndPublicKey(
>   signedAccountId,
>   debouncedDerivationPath,
> );
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Solana.jsx#L47-L50)
>
> On Solana, your address is the same as your public key.

> [tab] ◉ XRP
>
> ```js title="XRP.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { address, publicKey } = await Xrp.deriveAddressAndPublicKey(
>   signedAccountId,
>   debouncedDerivationPath,
> );
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/XRP.jsx#L45-L48)

> [tab] ◈ SUI
>
> ```js title="Sui.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { address, publicKey } = await Sui.deriveAddressAndPublicKey(
>   signedAccountId,
>   debouncedDerivationPath,
> );
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Sui.jsx#L51-L54)

> [tab] ⬟ Aptos
>
> ```js title="Aptos.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { address, publicKey } = await Aptos.deriveAddressAndPublicKey(
>   signedAccountId,
>   debouncedDerivationPath,
> );
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Aptos.jsx#L52-L55)

> [!NOTE]
>
> The same NEAR account and path will always produce the same address on the target blockchain.
>
> * `example.near` + `ethereum-1` = `0x1b48b83a308ea4beb845db088180dc3389f8aa3b`
> * `example.near` + `ethereum-2` = `0x99c5d3025dc736541f2d97c3ef3c90de4d221315`

***

## 2. Creating the Transaction

To construct the transaction to be signed use the method `prepareTransactionForSigning`.

> [tab] Ξ EVM
>
> Constructing a transaction to transfer ETH is very simple. The `value` is the amount of ETH in Wei as type BigInt (1 ETH = 10<sup>18</sup> Wei).
>
> ```js title="Transfer.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> return await Evm.prepareTransactionForSigning({
>   from: senderAddress,
>   to: receiverAddress,
>   value: BigInt(Web3.utils.toWei(transferAmount, "ether")),
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/7e1c9f1a8f8cf641685076810a155f5fdfe05d92/src/components/EVM/Transfer.jsx#L17-L21)
>
> This method returns the `unsigned transaction` and the transaction `hash(es)` (also known as the `payload`).

> [tab] ₿ Bitcoin
>
> Constructing a transaction to transfer BTC is very simple. The `value` is the amount of BTC in satoshis as a string (1 BTC = 100,000,000 sats).
>
> ```js title="Bitcoin.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { transaction, hashesToSign } =
>   await Bitcoin.prepareTransactionForSigning({
>     publicKey: senderPublicKey,
>     from: senderAddress,
>     to: receiverAddress,
>     value: transferAmount.toString(),
>   });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Bitcoin.jsx#L71-L77)
>
> This method returns the `unsigned transaction` and the transaction `hash(es)` (also known as the `payload`).

> [tab] ◎ Solana
>
> Constructing a transaction to transfer SOL is very simple. The `value` is the amount of SOL in lamports as type BigInt (1 SOL = 1,000,000,000 lamports).
>
> ```js title="Solana.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const {
>   transaction: { transaction },
>   hashesToSign,
> } = await Solana.prepareTransactionForSigning({
>   from: senderAddress,
>   to: receiverAddress,
>   amount: decimalToBigInt(transferAmount, 9),
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Solana.jsx#L65-L72)
>
> This method returns the `unsigned transaction` and `hashesToSign`, the message bytes to pass to the signing contract.

> [tab] ◉ XRP
>
> Constructing a transaction to transfer XRP is straightforward. The `value` is the amount of XRP in drops as a string (1 XRP = 1,000,000 drops).
>
> ```js title="XRP.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const { transaction, hashesToSign } =
>   await Xrp.prepareTransactionForSigning({
>     from: senderAddress,
>     to: receiverAddress,
>     amount: decimalToBigInt(transferAmount, 6).toString(),
>     publicKey: senderPublicKey,
>   });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/XRP.jsx#L63-L69)
>
> This method returns the `unsigned transaction` and the transaction `hash` (also known as the `payload`).

> [tab] ◈ SUI
>
> Constructing a transaction to transfer SUI is simple. The `value` is the amount of SUI in MIST as type BigInt (1 SUI = 1,000,000,000 MIST).
>
> ```js title="Sui.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionSui = new Transaction();
>
> const [coin] = transactionSui.splitCoins(transactionSui.gas, [
>   decimalToBigInt(transferAmount, 9),
> ]);
>
> transactionSui.transferObjects([coin], receiverAddress);
> transactionSui.setSender(senderAddress);
>
> const { hashesToSign, transaction } =
>   await Sui.prepareTransactionForSigning(transactionSui);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Sui.jsx#L70-L80)
>
> This method returns the `unsigned transaction` and the transaction `hash` (also known as the `payload`).

> [tab] ⬟ Aptos
>
> Constructing a transaction to transfer APT is straightforward. The `value` is the amount of APT in octas as type BigInt (1 APT = 100,000,000 octas).
>
> ```js title="Aptos.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionPayload = {
>   function: "0x1::aptos_account::transfer",
>   functionArguments: [receiverAddress, decimalToBigInt(transferAmount, 8)],
> };
>
> const transaction = await aptosClient.transaction.build.simple({
>   sender: senderAddress,
>   data: transactionPayload,
> });
>
> const { hashesToSign } =
>   await Aptos.prepareTransactionForSigning(transaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Aptos.jsx#L71-L82)
>
> This method returns the `unsigned transaction` and the transaction `hash` (also known as the `payload`).

> [accordion] EVM Function Calls
>
> To call a function on a smart contract we need the ABI of the contract, in our repo this is defined in the [config.js](https://github.com/near-examples/near-multichain/blob/main/src/config.js#L23-L63) file (this can be gathered from Remix or using Etherscan).
>
> Then define a `Contract` object using the `ethers` library
>
> ```js title="FunctionCall.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const contract = useMemo(() => new Contract(contractAddress, ABI, new JsonRpcProvider(rpcUrl)), [contractAddress, rpcUrl]);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/FunctionCall.jsx#L17-L17)
>
> Then to construct the transaction
>
> ```js title="FunctionCall.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const data = contract.interface.encodeFunctionData("set", [number]);
>
> return await Evm.prepareTransactionForSigning({
>   from: senderAddress,
>   to: contractAddress,
>   data,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/FunctionCall.jsx#L30-L36)
>
> This approach allows you to call smart contract functions by encoding the function data and including it in the transaction.

***

## 3. Requesting the Signature

Once the transaction is created and ready to be signed, a signature request is made by calling `sign` on the MPC smart contract.

The method requires four parameters:

1. The `payloads` (or hashes) to be signed for the target blockchain
2. The derivation `path` for the account we want to use to sign the transaction
3. The `keyType`, `Ecdsa` for `Secp256k1` signatures and `Eddsa` for `Ed25519` signatures.
4. The `signerAccount` which contains the `accountId` that is signing and the `signAndSendTransactions` function from [Near Connect](https://docs.near.org/web3-apps/tutorials/wallet-login.md).

> [tab] Ξ EVM
>
> ```js title="EVM.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rsvSignatures = await SIGNET_CONTRACT.sign({
>   payloads: hashesToSign,
>   path: debouncedDerivationPath,
>   keyType: "Ecdsa",
>   signerAccount: {
>     accountId: signedAccountId,
>     signAndSendTransactions,
>   },
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/EVM.jsx#L115-L123)

> [tab] ₿ Bitcoin
>
> ```js title="Bitcoin.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rsvSignatures = await SIGNET_CONTRACT.sign({
>   payloads: hashesToSign,
>   path: debouncedDerivationPath,
>   keyType: "Ecdsa",
>   signerAccount: {
>     accountId: signedAccountId,
>     signAndSendTransactions,
>   },
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Bitcoin.jsx#L83-L91)
>
> For Bitcoin, it is common to have multiple UTXOs to sign when sending a single transaction. We create a NEAR transaction (to call `sign` on the MPC contract) for each UTXO and send them to be signed by the MPC individually. Each signature is then parsed from each transaction outcome to produce an array of signatures.

> [tab] ◎ Solana
>
> Pass the `hashesToSign` returned by `Solana.prepareTransactionForSigning` directly to `SIGNET_CONTRACT.sign`. For Solana, the adapter supplies the serialized transaction message as a byte array for Ed25519 signing.
>
> ```js title="Solana.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rsvSignatures = await SIGNET_CONTRACT.sign({
>   payloads: hashesToSign,
>   path: debouncedDerivationPath,
>   keyType: "Eddsa",
>   signerAccount: {
>     accountId: signedAccountId,
>     signAndSendTransactions,
>   },
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Solana.jsx#L79-L87)

> [tab] ◉ XRP
>
> ```js title="XRP.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rsvSignatures = await SIGNET_CONTRACT.sign({
>   payloads: hashesToSign,
>   path: debouncedDerivationPath,
>   keyType: "Ecdsa",
>   signerAccount: {
>     accountId: signedAccountId,
>     signAndSendTransactions,
>   },
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/XRP.jsx#L76-L84)

> [tab] ◈ SUI
>
> ```js title="Sui.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rsvSignatures = await SIGNET_CONTRACT.sign({
>   payloads: hashesToSign,
>   path: debouncedDerivationPath,
>   keyType: "Eddsa",
>   signerAccount: {
>     accountId: signedAccountId,
>     signAndSendTransactions,
>   },
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Sui.jsx#L87-L95)

> [tab] ⬟ Aptos
>
> ```js title="Aptos.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const rsvSignatures = await SIGNET_CONTRACT.sign({
>   payloads: hashesToSign,
>   path: debouncedDerivationPath,
>   keyType: "Eddsa",
>   signerAccount: {
>     accountId: signedAccountId,
>     signAndSendTransactions,
>   },
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Aptos.jsx#L88-L96)

***

## 4. Formatting the Signature

Once the signature is returned from the MPC it needs to be formatted and added to the transaction to produce a signed transaction.

> [tab] Ξ EVM
>
> ```js title="EVM.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const finalizedTransaction = Evm.finalizeTransactionSigning({
>   transaction,
>   rsvSignatures,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/EVM.jsx#L125-L128)

> [tab] ₿ Bitcoin
>
> ```js title="Bitcoin.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const finalizedTransaction = Bitcoin.finalizeTransactionSigning({
>   transaction,
>   rsvSignatures,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Bitcoin.jsx#L97-L100)
>
> For Bitcoin, the array of signatures is added to the transaction to produce a complete signed transaction.

> [tab] ◎ Solana
>
> ```js title="Solana.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const finalizedTransaction = Solana.finalizeTransactionSigning({
>   transaction,
>   rsvSignatures: rsvSignatures[0],
>   senderAddress,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Solana.jsx#L93-L97)

> [tab] ◉ XRP
>
> ```js title="XRP.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const finalizedTransaction = Xrp.finalizeTransactionSigning({
>   transaction,
>   rsvSignatures,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/XRP.jsx#L90-L93)

> [tab] ◈ SUI
>
> ```js title="Sui.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const finalizedTransaction = Sui.finalizeTransactionSigning({
>   transaction,
>   rsvSignatures: rsvSignatures[0],
>   publicKey: senderPublicKey,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Sui.jsx#L101-L105)

> [tab] ⬟ Aptos
>
> ```js title="Aptos.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const finalizedTransaction = Aptos.finalizeTransactionSigning({
>   transaction,
>   rsvSignatures: rsvSignatures[0],
>   publicKey: senderPublicKey,
> });
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Aptos.jsx#L102-L106)

***

## 5. Relaying the Signed Transaction

Now that we have a signed transaction, we can relay it to the target network using `broadcastTx`.

> [tab] Ξ EVM
>
> ```js title="EVM.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionHash = await Evm.broadcastTx(signedTransaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/EVM/EVM.jsx#L150-L150)

> [tab] ₿ Bitcoin
>
> ```js title="Bitcoin.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionHash = await Bitcoin.broadcastTx(signedTransaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Bitcoin.jsx#L119-L119)

> [tab] ◎ Solana
>
> ```js title="Solana.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionHash = await Solana.broadcastTx(signedTransaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Solana.jsx#L116-L116)

> [tab] ◉ XRP
>
> ```js title="XRP.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionHash = await Xrp.broadcastTx(signedTransaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/XRP.jsx#L114-L114)

> [tab] ◈ SUI
>
> ```js title="Sui.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionHash = await Sui.broadcastTx(signedTransaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Sui.jsx#L124-L124)

> [tab] ⬟ Aptos
>
> ```js title="Aptos.jsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const transactionHash = await Aptos.broadcastTx(signedTransaction);
> ```
>
> [See code on GitHub](https://github.com/near-examples/near-multichain/blob/58a54ebb22847a719b554454a4ee1a575cfde9c8/src/components/Aptos.jsx#L123-L123)

The method returns a transaction hash which can be used to locate the transaction on an explorer.

> [!NOTE]
>
> ⭐️ For a deep dive into the concepts of Chain Signatures, see [What are Chain Signatures?](https://docs.near.org/chain-abstraction/chain-signatures.md)
>
> ⭐️ For a complete example of a NEAR account using chain signatures in a frontend, see our [web app example](https://github.com/near-examples/near-multichain).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.