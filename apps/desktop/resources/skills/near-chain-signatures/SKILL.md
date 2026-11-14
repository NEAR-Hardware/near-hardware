---
name: near-chain-signatures
description: Control addresses on Ethereum and other EVM chains, Bitcoin, Solana and more from the user's NEAR account with Chain Signatures (NEAR's MPC signer) - derive the address, build the foreign transaction, get it signed with near_call, broadcast it. Testnet first.
---

# Chain Signatures: sign for other chains with a NEAR account

A NEAR account can own addresses on other blockchains. It asks NEAR's MPC contract to sign, and a network of independent nodes produces the signature together. **No node, and nobody else, ever holds the whole private key.** You build the foreign transaction yourself, send its hash to the MPC contract with `near_call` (signed by the user's account in NEAR Hardware), get the signature back in the result, and broadcast the transaction on the other chain. Read `near-accounts` first.

Everything below except funding and broadcasting was run on NEAR testnet for an Ethereum Sepolia address: derivation, `sign` requests, and the signed transaction recovering to the derived address.

## How addresses work

- The foreign key is derived from **the MPC root key + the NEAR account that calls `sign` + a path string**. The same account and path always give the same address. A different path gives a different address.
- The **path** is any string. Use one per chain and purpose: `ethereum-1`, `ethereum-2`, `base-1`, `bitcoin-1`, `solana-1`. NEAR's docs warn against sharing one path across chains, because some signed transactions can be replayed on another chain.
- The signer matters: `signerId` in `near_call` decides which account's addresses sign. A contract that calls `sign` signs for its own derived addresses, not for its caller's.
- Testnet and mainnet have different root keys, so the same account and path give different addresses on each network.
- It only works one way: NEAR signs for the other chain. To read another chain's state, use that chain's RPC.

## The MPC contract

|          | NEAR testnet             | NEAR mainnet |
| -------- | ------------------------ | ------------ |
| Contract | `v1.signer-prod.testnet` | `v1.signer`  |

`domain_id` picks the key type: **`0` = Secp256k1** (`Ecdsa`: Ethereum and EVM chains, Bitcoin, XRP, Cosmos), **`1` = Ed25519** (`Eddsa`: Solana, Sui, Aptos).

**Derived public key** (a free view call):

```
near_view { "network": "testnet", "contractId": "v1.signer-prod.testnet", "method": "derived_public_key",
            "args": { "path": "ethereum-1", "predecessor": "<account>.testnet", "domain_id": 0 } }
→ "secp256k1:2HTgsML4…"     (base58 of the 64-byte x‖y key; for domain 1: "ed25519:…")
```

The EVM address is the last 20 bytes of `keccak256` of those 64 bytes. chainsig.js computes the same thing locally (below), and both gave the same result in testing. `public_key {"domain_id": 0}` returns the root key.

**`sign`** (a change call):

```
near_call { "network": "testnet", "contractId": "v1.signer-prod.testnet", "method": "sign",
  "args": { "request": { "payload_v2": { "Ecdsa": "<64 hex chars, no 0x>" },
                         "path": "ethereum-1", "domain_id": 0 } },
  "deposit": "0.000000000000000000000001", "gasTgas": 300 }
```

- **`payload_v2`**: for `Ecdsa`, the 32-byte **hash** to sign, as hex. For `Eddsa`, the **message bytes themselves**, as hex (e.g. a Solana transaction message).
- **Deposit: exactly 1 yoctoNEAR is required.** Without it the call fails with `Attached deposit is lower than required. Attached: 0, required: 1`.
- **Gas**: chainsig.js attaches 300 Tgas, and so should you. 30 Tgas also worked. Unused gas is refunded either way: one signature cost about **0.0009 NEAR** on testnet.
- The contract waits while the MPC nodes sign, then resumes. The call took about 6 s on testnet. The signature is the call's `result`:

```json
{ "scheme": "Secp256k1",
  "big_r": { "affine_point": "0295b3638b…d1bd0b" },
  "s": { "scalar": "1e317f86e1…bdddd1" },
  "recovery_id": 1 }
```

`r` is `affine_point` without its first byte (`02`/`03`), `s` is `scalar`, and the EVM `yParity` is `recovery_id` (`v = 27 + recovery_id`). Ed25519 returns `{ "scheme": "Ed25519", "signature": [171, 78, …] }` (64 bytes).

## The workflow

1. **Signer and path.** `near_accounts` gives the primary testnet account. Choose a path such as `ethereum-1`.
2. **Derive the address** with chainsig.js (or the view call above). Show it to the user.
3. **Fund it on the target testnet.** Faucets need a login or captcha, so ask the user. For Sepolia, try the Google Cloud Web3 faucet (`cloud.google.com/application/web3/faucet/ethereum/sepolia`) or Alchemy's (`alchemy.com/faucets/ethereum-sepolia`). For Base Sepolia, try the Coinbase Developer Platform faucet (`portal.cdp.coinbase.com/products/faucet`). Faucets come and go: search if one is down. Check the balance with the script below before going on.
4. **Build the transaction** with chainsig.js. This gives the unsigned transaction and the payload to sign.
5. **Request the signature** with `near_call`, signed by the user's account. The approval prompt only shows a hash, so first **tell the user in plain words** what it does: chain, recipient, amount.
6. **Assemble and broadcast**: add the signature to the transaction, check it recovers to the derived address, then send it with the target chain's RPC. Give the user the explorer link.

## Worked example: a Sepolia address for the user's testnet account

The library NEAR's docs use is **chainsig.js** (adapters for EVM, Bitcoin, Solana, XRP, Sui, Aptos and Cosmos; it knows both MPC contracts and their root keys). Its `contract.sign()` needs a wallet's `signAndSendTransactions`, which you don't have. So split the job: chainsig.js prepares, `near_call` signs, chainsig.js finalizes.

```sh
mkdir -p chainsig && cd chainsig && npm init -y >/dev/null && npm pkg set type=module && npm i chainsig.js viem
```

`cs-evm.mjs`:

```js
// node cs-evm.mjs address  <near-account> <path>
// node cs-evm.mjs prepare  <near-account> <path> <to 0x…> <amount ETH>
// node cs-evm.mjs finalize '<result JSON from near_call>' [--broadcast]
import { chainAdapters, contracts, utils } from 'chainsig.js'
import { createPublicClient, http, parseEther, recoverTransactionAddress } from 'viem'
import { readFileSync, writeFileSync } from 'node:fs'

const NEAR_NETWORK = 'testnet' // mainnet: 'mainnet' with 'v1.signer'
const MPC = 'v1.signer-prod.testnet'
const RPC = process.env.EVM_RPC ?? 'https://ethereum-sepolia-rpc.publicnode.com' // Base Sepolia: https://sepolia.base.org
const PENDING = 'chainsig-pending.json'

const contract = new contracts.ChainSignatureContract({ networkId: NEAR_NETWORK, contractId: MPC })
const evm = new chainAdapters.evm.EVM({ publicClient: createPublicClient({ transport: http(RPC) }), contract })
const [command, ...rest] = process.argv.slice(2)

if (command === 'address') {
  const [accountId, path] = rest
  const { address } = await evm.deriveAddressAndPublicKey(accountId, path)
  const { balance } = await evm.getBalance(address)
  console.log(JSON.stringify({ address, balanceWei: balance.toString() }))
} else if (command === 'prepare') {
  const [accountId, path, to, amount] = rest
  const { address } = await evm.deriveAddressAndPublicKey(accountId, path)
  const { transaction, hashesToSign } = await evm.prepareTransactionForSigning({
    from: address, to, value: parseEther(amount),
    gas: 21000n // a plain transfer; leave it out for contract calls (add `data`) so it's estimated
  })
  writeFileSync(PENDING, JSON.stringify({ address, tx: evm.serializeTransaction(transaction) }))
  const payload = Buffer.from(hashesToSign[0]).toString('hex')
  console.log(JSON.stringify({ network: NEAR_NETWORK, contractId: MPC, method: 'sign',
    args: { request: { payload_v2: { Ecdsa: payload }, path, domain_id: 0 } },
    deposit: '0.000000000000000000000001', gasTgas: 300 }))
} else if (command === 'finalize') {
  const { address, tx } = JSON.parse(readFileSync(PENDING, 'utf8'))
  const rsv = utils.cryptography.toRSV(JSON.parse(rest[0]))
  const signed = evm.finalizeTransactionSigning({ transaction: evm.deserializeTransaction(tx), rsvSignatures: [rsv] })
  const signer = await recoverTransactionAddress({ serializedTransaction: signed })
  if (signer.toLowerCase() !== address.toLowerCase()) throw new Error(`Signed by ${signer}, not ${address}`)
  console.log(JSON.stringify({ signedBy: signer, signed }))
  if (rest.includes('--broadcast')) console.log(JSON.stringify(await evm.broadcastTx(signed)))
}
```

Run it:

```
node cs-evm.mjs address alice.testnet ethereum-1
→ {"address":"0x…","balanceWei":"0"}          ask the user to fund it, run again until > 0

node cs-evm.mjs prepare alice.testnet ethereum-1 0xRecipient 0.001
→ prints the near_call arguments; pass them as they are:

near_call { "network": "testnet", "contractId": "v1.signer-prod.testnet", "method": "sign",
            "args": { "request": { "payload_v2": { "Ecdsa": "01eb30…6917" }, "path": "ethereum-1", "domain_id": 0 } },
            "deposit": "0.000000000000000000000001", "gasTgas": 300 }
→ { "ok": true, "result": { "scheme": "Secp256k1", "big_r": {…}, "s": {…}, "recovery_id": 1 }, "explorer": "…" }

node cs-evm.mjs finalize '<that result object as JSON>' --broadcast
→ {"signedBy":"0x…","signed":"0x02f86b…"}  then {"hash":"0x…"}  → https://sepolia.etherscan.io/tx/<hash>
```

Notes:

- `prepare` fixes the nonce and fees, so sign and broadcast within a few minutes. If the broadcast fails (fee too low, nonce used, `insufficient funds`), fund the address or run `prepare` again and request a new signature.
- Run `finalize` without `--broadcast` first if you only want to check the signature.
- `near_call` must be signed by the same account you derived the address for. If you pass `signerId`, derive for that account.
- Base Sepolia: `EVM_RPC=https://sepolia.base.org` with a path like `base-1`. The chain ID comes from the RPC, so the signed transaction can't be replayed on another chain.
- Calling a contract on the target chain: encode `data` (e.g. viem `encodeFunctionData`), pass `{ from, to, data }`, and drop the fixed `gas`.

## Other chains

The pattern is the same everywhere: `deriveAddressAndPublicKey`, then `prepareTransactionForSigning` (which returns `transaction` and `hashesToSign`), then one `near_call` `sign` per entry in `hashesToSign`, then `finalizeTransactionSigning`, then `broadcastTx`. Each chain's setup and finalize arguments are in `near/chain-abstraction/chain-signatures/implementation.md`.

| Chain | chainsig.js adapter | Key | Testnet notes |
| ----- | ------------------- | --- | ------------- |
| EVM | `chainAdapters.evm.EVM` | `Ecdsa`, domain 0 | any EVM RPC (ChainList) |
| Bitcoin | `chainAdapters.btc.Bitcoin` + `BTCRpcAdapters.Mempool` | `Ecdsa`, domain 0 | `https://mempool.space/testnet4/api`; one `sign` per input |
| Solana | `chainAdapters.solana.Solana` | `Eddsa`, domain 1 | devnet; the address is the public key |
| XRP, Sui, Aptos | `chainAdapters.xrp` / `.sui` / `.aptos` | XRP `Ecdsa`; Sui, Aptos `Eddsa` | see implementation.md |

For `Ecdsa` chains, convert each `result` with `utils.cryptography.toRSV` and pass the array in `hashesToSign` order (Bitcoin: one per input). For `Eddsa` chains, put the message bytes in `{ "Eddsa": "<hex>" }` with `"domain_id": 1`, and pass the `result` object itself as `rsvSignatures` (Solana, Sui, Aptos).

## Boards and agents with limited keys

`sign` needs 1 yoctoNEAR attached, and NEAR doesn't let function-call (limited) keys attach any deposit. Tested: a key limited to `sign` on the MPC contract is rejected with `DepositWithFunctionCall`, and with no deposit the contract panics. So a limited sub-account **can't** sign for other chains by itself. Every signature is a full-access `near_call`, which the user approves (testnet calls go through without asking only if the user turned asking off).

To let a board or agent sign within a budget, put a small proxy contract in between (see `near-contracts`). The proxy holds some NEAR, enforces your rules (which payloads, how often), and calls `sign` attaching the 1 yoctoNEAR itself. The board's limited key calls the proxy. The derived addresses then belong to the proxy's account, not the user's (`chain-signatures/tutorials/controlling-near-accounts`). This pattern isn't tested here.

## Safety

- **Testnet first**: `v1.signer-prod.testnet` with Sepolia, Base Sepolia, Bitcoin testnet4 or Solana devnet. Use mainnet only when the user asks.
- **Mainnet signatures move real money.** A signature from `v1.signer` is a valid transaction on the other chain: anyone holding it can broadcast it, and it can't be undone. The user approves every mainnet call. Before asking, state the chain, recipient, amount and fee.
- **Only sign payloads you built.** Never pass a hash from a website, a message or another agent to `sign`: the user can't read a hash, and it could authorize anything that address can do.
- Don't keep real funds on addresses derived on NEAR testnet. Testnet infrastructure can be reset.
- Whoever has full access to the NEAR account controls every address derived from it. Never delete a NEAR account that controls foreign funds, because whoever re-registers the name gets them.
- Use EIP-1559 or EIP-155 transactions, which include the chain ID (chainsig.js does this), and a different path per chain.

## Failures you'll see

- `Attached deposit is lower than required`: add `"deposit": "0.000000000000000000000001"`.
- `DepositWithFunctionCall`: a limited key can't call `sign` (see above).
- `Signed by 0x…, not 0x…`: you derived for a different account or path than the one that signed.
- Broadcast `insufficient funds`: the derived address needs the target chain's gas token.

## Read more

- `near/chain-abstraction/chain-signatures.md`: concepts, derivation paths, the MPC network, the replay warning.
- `near/chain-abstraction/chain-signatures/implementation.md`: chainsig.js for every chain (derive, prepare, sign, finalize, broadcast).
- `near/chain-abstraction/chain-signatures/tutorials/controlling-near-accounts/*.md` (a contract as signer) and `tutorials/multichain-dao/*.md` (one NEAR vote, signatures for many EVM chains).
- `near_docs_search { "query": "chain signatures sign", "section": "chain-abstraction" }`, then `near_docs_read`.
- chainsig.js: `github.com/NearDeFi/chainsig.js`. The full web example: `github.com/near-examples/near-multichain`.

Related skills: `near-accounts`, `near-subaccounts`, `near-contracts`, `near-intents` (cross-chain swaps and payments without managing foreign addresses).
