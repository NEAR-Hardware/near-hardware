> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Become a market maker on NEAR Intents

In this guide, you will set up and run an example solver that connects to the [Message Bus](https://docs.near-intents.org/integration/market-makers/message-bus/introduction.md), receives live quote requests, and automatically responds to the ones it can fill.

> [!WARNING]
>
> To become a Market Maker you will need to request an API Key through the [Partner Portal](https://partners.near-intents.org) and go through KYC/KYB

***

## Getting started

**1. Prerequisites**

* Node.js v20.18+ with npm
* A NEAR **mainnet** account

**2. Clone the Example Solver Repository**

The [AMM Solver example](https://github.com/defuse-protocol/near-intents-amm-solver) uses a simple constant-product AMM formula to price quotes

```bash theme={null}
git clone https://github.com/defuse-protocol/near-intents-amm-solver.git
cd near-intents-amm-solver
npm install
```

**3. Configure your environment**

Create your environment file from the provided example:

```bash theme={null}
cp env/.env.example env/.env.local
```

Open `env/.env.local` and fill your NEAR account credentials, the token pair you want to market-make, and your desired fee margin.

> [accordion] Example .env file
>
> ```bash theme={null}
> # Your NEAR account credentials
> NEAR_ACCOUNT_ID=your-solver.near
> NEAR_PRIVATE_KEY=ed25519:your_private_key_here
>
> # The token pair you want to market-make
> AMM_TOKEN1_ID=usdt.tether-token.near
> AMM_TOKEN2_ID=wrap.near
>
> # Network and mode
> NEAR_NETWORK_ID=mainnet
> TEE_ENABLED=false
>
> # Your solver will take this percentage from the quoted price as profit (0.3 = 0.3% = 30 bps)
> MARGIN_PERCENT=0.3
> ```

**4. Get a Partner JWT**

The Message Bus WebSocket endpoint (`wss://solver-relay-v2.chaindefuser.com/ws`) requires authentication. To get your credentials:

1. Sign up at [partners.near-intents.org](https://partners.near-intents.org)
2. Request access through the partner portal
3. Complete KYC/KYB verification as part of the application process

Once approved, add your Partner JWT to `env/.env.local`:

```bash theme={null}
# Partner JWT for relay authentication
PARTNER_JWT=your_partner_jwt_here
```

The example solver automatically uses this token for WebSocket authentication — no code changes required.

> [!WARNING]
>
> Never commit your private key or Partner JWT to version control. The `.env.local` file is already in `.gitignore`, but double-check before pushing any changes.

**5. Deposit liquidity**

Your solver can only fill swaps if it has token balances inside the Verifier contract (`intents.near`).

You need to do two things: register your solver's public key on the contract, and deposit tokens.

**1. Register your public key**

```bash theme={null}
npx near-cli-rs contract call-function as-transaction intents.near add_public_key \
  json-args '{"public_key":"ed25519:YOUR_PUBLIC_KEY"}' \
  prepaid-gas '100.0 Tgas' attached-deposit '1 yoctoNEAR' \
  sign-as SOLVER_ACCOUNT_ID network-config mainnet sign-with-keychain send
```

Replace `YOUR_PUBLIC_KEY` with the public key that corresponds to the private key in your `.env.local` file, and `SOLVER_ACCOUNT_ID` with your actual NEAR account ID.

**2. Deposit tokens**

* [near.com](https://near.com/) - a web interface for swapping and depositing tokens

The solver needs balances for both tokens in the configured pair. For example, if you are market-making USDT/wNEAR, it needs both `usdt.tether-token.near` and `wrap.near` deposited into the contract.

**6. Start the solver**

Since the environment file is named `.env.local`, set `NODE_ENV=local` so the app picks it up:

```bash theme={null}
NODE_ENV=local npm start
```

On startup, the solver connects to the Message Bus WebSocket, subscribes to quote events, and begins polling the Verifier contract for current token balances every 15 seconds. Log output confirms the connection and initial reserves.

**7. Verify it is working**

Check the health endpoint to confirm the solver is running:

```bash theme={null}
curl http://localhost:3000
```

```json theme={null}
{"ready": true}
```

In the logs, look for:

* Connection confirmed - successful WebSocket connection to the Message Bus
* Quote requests - incoming swap requests being evaluated
* Quote responses - signed quotes being sent back for pairs your solver supports

The solver only responds to requests for the configured token pair. If a request comes in for a different pair, or if reserves are too low to fill it, the solver skips it.

> [!TIP]
>
> If quote requests are not appearing, that is normal during low-activity periods. The solver sends responses when matching requests arrive.

***

## Next steps

Now that the solver is running, read the [Example Solver](https://docs.near-intents.org/integration/market-makers/example.md) guide to understand how the code works — from WebSocket connection through intent signing and settlement — and learn how to customize the pricing logic for your own strategy.

> [!TIP]
>
> The example solver also supports **Confidential Intents** for solving against private liquidity. See the [Confidential Intents](https://docs.near-intents.org/integration/market-makers/confidential-intents.md) guide to learn how to enable confidential mode.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.