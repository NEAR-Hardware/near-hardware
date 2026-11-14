---
name: near-devices
description: Put NEAR on a board - read the chain from firmware over Wi-Fi, give the board its own on-chip key and a limited NEAR account, and show the user's account and avatar on the board's screen.
---

# NEAR on a board

A board can take part in NEAR three ways, from simplest to most independent. Read `near-accounts` and `near-subaccounts` first.

## 1. Show NEAR data (read-only, no keys)

Any board with Wi-Fi can read the chain with a plain HTTPS POST to NEAR's JSON-RPC. No account, key or signature needed.

- RPC: `https://rpc.testnet.fastnear.com` (testnet) or `https://rpc.mainnet.fastnear.com` (mainnet)
- An account's balance:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "query",
  "params": { "request_type": "view_account", "finality": "final", "account_id": "alice.testnet" }
}
```

`result.amount` is yoctoNEAR as a decimal string (divide by 10^24; use a string or 128-bit math, it doesn't fit in 64 bits).

- A contract's view method (`args_base64` is the base64 of the JSON arguments, `e30=` for `{}`):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "query",
  "params": {
    "request_type": "call_function",
    "finality": "final",
    "account_id": "counter.alice.testnet",
    "method_name": "get_count",
    "args_base64": "e30="
  }
}
```

`result.result` is an array of bytes: the method's return value as UTF-8 JSON.

On ESP32 with Arduino use `WiFiClientSecure` + `HTTPClient` and ArduinoJson. Poll every few seconds at most.

**The user's account and avatar.** `near_accounts` returns each account's 16×16 pixel `avatar` (a palette and rows of base-36 palette indices). Bake it into the firmware as a palette array and a 16×16 index array, and draw it scaled up (e.g. 8× on a 410-pixel-wide watch) with the account name and balance: it's how the user sees which account the board belongs to. Add the screen to `screens/` so the app previews it.

## 2. Let the board act through a limited account

To change something on-chain (e.g. record a sensor reading), the board needs an account and a key. The safe default:

1. **Generate the key on the board**, never on the Mac: an ed25519 key pair from the chip's hardware random number generator, stored in NVS (ESP32) or flash, kept across reboots. On ESP32, libsodium (`crypto_sign_keypair`, part of ESP-IDF) or Monocypher work; in Arduino projects add the library through PlatformIO.
2. **Print only the public key** over serial at boot, as `ed25519:<base58 of the 32-byte public key>`. Read it with `serial_read`.
3. **Create the board's account** with that key, limited to your contract and methods:

```
near_create_subaccount { "name": "watch", "access": "limited",
  "contractId": "counter.alice.testnet", "methodNames": ["record"],
  "publicKey": "<the key the board printed>" }
```

4. The board signs its own transactions: Borsh-encode the transaction (signer `watch.alice.testnet`, its public key, the key's nonce + 1 from `view_access_key`, receiver, a recent block hash from the `block` RPC, one FunctionCall action), sign the SHA-256 of it with the on-chip key, and send it with the `send_tx` RPC method. NEAR enforces the limits: the board can only call `record`, can't move NEAR, and stops when its fee allowance runs out.

Keep the private key out of logs, serial output, `BOARD.md` and git.

## 3. Ask the human on the device

For anything worth real money, show the request on the board's screen and only sign after a physical confirmation (a button press or a tap). The agent proposes, the person approves on the hardware.

## Checklist

- Testnet first; mainnet only when the user asks.
- Save the board's account ID, the contract ID and the network in `BOARD.md`.
- After setting up an account, confirm its limits with `near_account_info`.
