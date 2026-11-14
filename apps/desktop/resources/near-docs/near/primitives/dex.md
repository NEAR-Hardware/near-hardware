> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Decentralized Exchanges (DEX)

> Learn how to interact with decentralized exchanges on NEAR Protocol, including token swapping, liquidity pools, and integration with Rhea Finance DEX.

A Decentralized Exchange (DEX) is an application that allows users to trade tokens (native & fungible tokens) through smart contracts.

![dex](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/primitives/dex.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=eb7bfa850973c81d81190d0d5948fcf0)

In brief, DEXs work by having [pools of token pairs](https://guide.rhea.finance/products/overview/pooling) (e.g. NEAR-USDC) that users can deposit tokens into.

The ratio of the tokens in the pool determines the exchange rate for a swap. Indeed, swapping is adding tokens to one side of the pool while removing tokens from the other side of the pool.

> [!NOTE]
>
> This docs refer to [Rhea Finance](https://rhea.finance/) (formerly Ref Finance), a community built DEX in NEAR.
>
> Please check their [docs](https://guide.rhea.finance/) for more information.

The WebApp examples use the local `useNearWallet` hook from the [Hello NEAR provider setup](https://docs.near.org/web3-apps/quickstart.md#context-provider).

***

## Query Token Exchange Rate

One can query the exchange rate of a token pair by calling the `get-token-price` method on the DEX contract.

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const tokenContract = 'token.v2.ref-finance.near';
> const tokenPriceResult = await fetch(
>   `https://indexer.ref.finance/get-token-price?token_id=${tokenContract}`,
> );
> const tokenPriceValue = await tokenPriceResult.json();
> ```
>
> > [accordion] Example response
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "token_contract_id": "token.v2.ref-finance.near",
> >   "price": "0.08153090"
> > }
> > ```
>
> > [!TIP]
> >
> > Rhea Finance has a method to [get all token prices at once](https://indexer.ref.finance/list-token-price).

***

## Query Whitelisted Tokens

Anyone list tokens for sale in the DEX. This is why, in order to protect users, the DEX contract has a list of whitelisted tokens that can be traded.

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view v2.ref-finance.near get_whitelisted_tokens
> ```
>
> > [accordion] Examples Response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> >   'wrap.near',
> >   'usdt.tether-token.near',
> >   'berryclub.ek.near',
> >   'farm.berryclub.ek.near',
> >   'token.v2.ref-finance.near',
> >   'token.paras.near',
> >   'marmaj.tkn.near',
> >   'meta-pool.near',
> >   ...
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/dex/whitelist-tokens.json)
>
> > [accordion] Examples Response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> >   'wrap.near',
> >   'usdt.tether-token.near',
> >   'berryclub.ek.near',
> >   'farm.berryclub.ek.near',
> >   'token.v2.ref-finance.near',
> >   'token.paras.near',
> >   'marmaj.tkn.near',
> >   'meta-pool.near',
> >   ...
> > ```

***

## Register in the DEX

In order to use the contract, make sure to register your account in the DEX by paying for the storage you will use in order to keep track of your balances.

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call v2.ref-finance.near storage_deposit '' --useAccount <account> --amount 0.1
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/dex/register-dex.json)

***

## Deposit funds

In order to swap tokens, one must first deposit tokens into the DEX. For this, you will need to transfer the FT you want to swap to the DEX contract.

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call token.v2.ref-finance.near ft_transfer_call {"receiver_id": "v2.ref-finance.near", "amount": "1000000000000", "msg": ""} --gas 300000000000000 --depositYocto 1 --useAccount <account>
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/dex/deposit-funds.json)

> [!WARNING]
>
> Do **NOT** transfer **NEAR** tokens to Rhea Finance. Instead, call `near_deposit` in the [`wrap.near`](https://nearblocks.io/address/wrap.near) contract, attaching the amount of NEAR you want to swap.
>
> This will mint `wrap.near` for you, which you can then transfer to Rhea Finance.

***

## Get Deposit Balances

Query your deposit balances by calling the `get_deposits` method:

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const AMM_CONTRACT_ADDRESS = 'v2.ref-finance.near';
>
> const { viewFunction } = useNearWallet();
>
> await viewFunction({
>   method: 'get_deposits',
>   args: {
>     account_id: 'bob.near',
>   },
>   contractId: AMM_CONTRACT_ADDRESS,
> });
> ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application
>
> > [accordion] Example response
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "token.v2.ref-finance.near": "0",
> >   "wrap.near": "0"
> > }
> > ```

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view v2.ref-finance.near get_deposits '{"account_id": "bob.near"}'
> ```
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   'token.v2.ref-finance.near': '0',
> >   'wrap.near': "0"
> > }
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/dex/deposit-balance.json)
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   'token.v2.ref-finance.near': '0',
> >   'wrap.near': "0"
> > }
> > ```

> [tab] 📄 Contract
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> // Validator interface, for cross-contract calls
> #[ext_contract(ext_amm_contract)]
> trait ExternalAmmContract {
> fn get_deposits(&self, account_id: AccountId) -> Promise;
> }
>
> // Implement the contract structure
> #[near]
> impl Contract {
> #[private] // Public - but only callable by env::current_account_id()
> pub fn external_get_deposits_callback(&self, #[callback_result] call_result: Result<HashMap<AccountId, U128>, PromiseError>) -> Option<HashMap<AccountId, U128>> {
> // Check if the promise succeeded
> if call_result.is_err() {
>   log!("There was an error contacting external contract");
>   return None;
> }
>
> // Return the pools data
> let deposits_data = call_result.unwrap();
> return Some(deposits_data);
> }
>
> pub fn get_contract_deposits(&self) -> Promise {
> let promise = ext_amm_contract::ext(self.amm_contract.clone())
>   .get_deposits(env::current_account_id());
>
> return promise.then( // Create a promise to callback query_greeting_callback
>   Self::ext(env::current_account_id())
>   .external_get_deposits_callback()
> )
> }
> }
> ```

***

### Query Pools

DEXs work by having multiple pools of token pairs (e.g. NEAR-USDC) that users can deposit tokens into.

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const AMM_CONTRACT_ADDRESS = 'v2.ref-finance.near';
>
> const { viewFunction } = useNearWallet();
>
> await viewFunction({
>   method: 'get_pools',
>   args: {
>     from_index: 0,
>     limit: 1000,
>   },
>   contractId: AMM_CONTRACT_ADDRESS,
> });
> ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application
>
> > [accordion] Example response
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > [
> >   {
> >     pool_kind: 'SIMPLE_POOL',
> >     token_account_ids: ['token.skyward.near', 'wrap.near'],
> >     amounts: ['51865812079751349630100', '6254162663147994789053210138'],
> >     total_fee: 30,
> >     shares_total_supply: '1305338644973934698612124055',
> >     amp: 0,
> >   },
> >   {
> >     pool_kind: 'SIMPLE_POOL',
> >     token_account_ids: [
> >       'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near',
> >       'wrap.near',
> >     ],
> >     amounts: ['783621938569399817', '1100232280852443291118200599'],
> >     total_fee: 30,
> >     shares_total_supply: '33923015415693335344747628',
> >     amp: 0,
> >   },
> > ];
> > ```

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view v2.ref-finance.near get_pools '{"from_index": 0, "limit": 1000}'
> ```
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > [
> >   {
> >     pool_kind: 'SIMPLE_POOL',
> >     token_account_ids: [ 'token.skyward.near', 'wrap.near' ],
> >     amounts: [ '51865812079751349630100', '6254162663147994789053210138' ],
> >     total_fee: 30,
> >     shares_total_supply: '1305338644973934698612124055',
> >     amp: 0
> >   },
> >   {
> >     pool_kind: 'SIMPLE_POOL',
> >     token_account_ids: [
> >       'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near',
> >       'wrap.near'
> >     ],
> >     amounts: [ '783621938569399817', '1100232280852443291118200599' ],
> >     total_fee: 30,
> >     shares_total_supply: '33923015415693335344747628',
> >     amp: 0
> >   }
> > ]
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/dex/query-pools.json)
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > [
> >   {
> >     pool_kind: 'SIMPLE_POOL',
> >     token_account_ids: [ 'token.skyward.near', 'wrap.near' ],
> >     amounts: [ '51865812079751349630100', '6254162663147994789053210138' ],
> >     total_fee: 30,
> >     shares_total_supply: '1305338644973934698612124055',
> >     amp: 0
> >   },
> >   {
> >     pool_kind: 'SIMPLE_POOL',
> >     token_account_ids: [
> >       'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near',
> >       'wrap.near'
> >     ],
> >     amounts: [ '783621938569399817', '1100232280852443291118200599' ],
> >     total_fee: 30,
> >     shares_total_supply: '33923015415693335344747628',
> >     amp: 0
> >   }
> > ]
> > ```

> [tab] 📄 Contract
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> #[near(serializers = [json])]
> pub struct PoolInfo {
>   /// Pool kind.
>   pub pool_kind: String,
>   /// List of tokens in the pool.
>   pub token_account_ids: Vec<AccountId>,
>   /// How much NEAR this contract has.
>   pub amounts: Vec<U128>,
>   /// Fee charged for swap.
>   pub total_fee: u32,
>   /// Total number of shares.
>   pub shares_total_supply: U128,
>   pub amp: u64,
> }
>
> // Validator interface, for cross-contract calls
> #[ext_contract(ext_amm_contract)]
> trait ExternalAmmContract {
>   fn get_pools(&self, from_index: u64, limit: u64) -> Promise;
> }
>
> // Implement the contract structure
> #[near]
> impl Contract {
>   #[private] // Public - but only callable by env::current_account_id()
>   pub fn external_get_pools_callback(&self, #[callback_result] call_result: Result<Vec<PoolInfo>, PromiseError>) -> Option<Vec<PoolInfo>> {
>     // Check if the promise succeeded
>     if call_result.is_err() {
>       log!("There was an error contacting external contract");
>       return None;
>     }
>
>     // Return the pools data
>     let pools_data = call_result.unwrap();
>     return Some(pools_data);
>   }
>
>   pub fn get_amm_pools(&self, from_index: u64, limit: u64) -> Promise {
>     let promise = ext_amm_contract::ext(self.amm_contract.clone())
>       .get_pools(from_index, limit);
>
>     return promise.then( // Create a promise to callback query_greeting_callback
>       Self::ext(env::current_account_id())
>       .external_get_pools_callback()
>     )
>   }
> }
> ```

***

## Swap tokens

In order to swap a token for another, you need to [have funds](#deposit-funds), and there needs to [**exist a pool**](#query-pools) that has **both tokens** on it.

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const AMM_CONTRACT_ADDRESS = 'v2.ref-finance.near';
>
> const { callFunction } = useNearWallet();
>
> await callFunction({
>   contractId: AMM_CONTRACT_ADDRESS,
>   method: 'swap',
>   args: {
>     actions: [
>       {
>         pool_id: 79,
>         token_in: 'token.v2.ref-finance.near',
>         token_out: 'wrap.near',
>         amount_in: '100000000000000000',
>         min_amount_out: '1',
>       },
>     ],
>   },
>   gas: 300000000000000,
>   deposit: 1,
> });
> ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application
>
> > [accordion] Example response
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > "5019606679394603179450"
> > ```

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call v2.ref-finance.near swap "{\"actions\": [{\"pool_id\": 79, \"token_in\": \"token.v2.ref-finance.near\", \"amount_in\": \"100000000000000000\", \"token_out\": \"wrap.near\", \"min_amount_out\": \"1\"}]}" --gas 300000000000000 --depositYocto 1
> --useAccount bob.near
> ```
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > '5019606679394603179450'
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/dex/swap-tokens.json)
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > '5019606679394603179450'
> > ```

> [tab] 📄 Contract
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> #[near(serializers = [json])]
> pub struct SwapAction {
>     /// Pool which should be used for swapping.
>     pub pool_id: u64,
>     /// Token to swap from.
>     pub token_in: AccountId,
>     /// Amount to exchange.
>     /// If amount_in is None, it will take amount_out from previous step.
>     /// Will fail if amount_in is None on the first step.
>     pub amount_in: Option<U128>,
>     /// Token to swap into.
>     pub token_out: AccountId,
>     /// Required minimum amount of token_out.
>     pub min_amount_out: U128,
> }
>
> // Validator interface, for cross-contract calls
> #[ext_contract(ext_amm_contract)]
> trait ExternalAmmContract {
>   fn swap(&self, actions: Vec<SwapAction>) -> Promise;
> }
>
> // Implement the contract structure
> #[near]
> impl Contract {
>   #[private] // Public - but only callable by env::current_account_id()
>   pub fn external_call_callback(&self, #[callback_result] call_result: Result<String, PromiseError>) {
>     // Check if the promise succeeded
>     if call_result.is_err() {
>       log!("There was an error contacting external contract");
>     }
>   }
>
>   #[payable]
>   pub fn swap_tokens(&mut self, pool_id: u64, token_in: AccountId, token_out: AccountId, amount_in: U128, min_amount_out: U128) -> Promise {
>     assert_eq!(env::attached_deposit(), 1, "Requires attached deposit of exactly 1 yoctoNEAR");
>
>     let swap_action = SwapAction {
>       pool_id,
>       token_in,
>       token_out,
>       amount_in: Some(amount_in),
>       min_amount_out
>     };
>
>     let mut actions = Vec::new();
>     actions.push(swap_action);
>
>     let promise = ext_amm_contract::ext(self.amm_contract.clone())
>       .with_static_gas(Gas(150*TGAS))
>       .with_attached_deposit(YOCTO_NEAR)
>       .swap(actions);
>
>     return promise.then( // Create a promise to callback query_greeting_callback
>       Self::ext(env::current_account_id())
>       .with_static_gas(Gas(100*TGAS))
>       .external_call_callback()
>     )
>   }
> }
> ```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.