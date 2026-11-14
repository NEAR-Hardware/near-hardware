> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Using FTs

> Learn how to create, transfer, and integrate FT in your dApp

Wanting to use Fungible Tokens (FT) in your dApp? Here you will find all the information you need to get started creating your own tokens, registering users, querying balances, transferring tokens, and integrating them into your smart contracts.

The WebApp examples use the local `useNearWallet` hook from the [Hello NEAR provider setup](https://docs.near.org/web3-apps/quickstart.md#context-provider).

***

## Creating a New Token

Use the existing global FT contract to create a token. Reuse its deployed code and configure the owner, initial supply, and metadata through initialization arguments.

### Global Contracts

You can deploy a new Fungible Token using our global FT contract - a pre-deployed [standard FT contract](https://github.com/near-examples/FT) that you can reuse. [Global contracts](https://docs.near.org/smart-contracts/global-contracts.md) are deployed once and can be reused by any account without incurring high storage costs.

| Network | Global FT contract |
| - | - |
| Mainnet | `ft.globals.primitives.near` |
| Testnet | `ft.globals.primitives.testnet` |

> [tab] By Account
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near contract deploy <account-id> use-global-account-id ft.globals.primitives.testnet \
>   with-init-call \
>   new_default_meta \
>   json-args '{"owner_id": "<account-id>", "total_supply": "100000000000000000000000000000"}' \
>   prepaid-gas '100.0 Tgas' \
>   attached-deposit '0 NEAR' \
>   network-config testnet \
>   sign-with-keychain send
> ```

> [tab] By Hash
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near contract deploy <account-id> use-global-hash 3vaopJ7aRoivvzZLngPQRBEd8VJr2zPLTxQfnRCoFgNX \
>   with-init-call \
>   new_default_meta \
>   json-args '{"owner_id": "<account-id>", "total_supply": "100000000000000000000000000000"}' \
>   prepaid-gas '100.0 Tgas' \
>   attached-deposit '0 NEAR' \
>   network-config testnet \
>   sign-with-keychain send
> ```

> [!NOTE]
>
> Deploying by **hash** creates an immutable contract that never changes. Deploying by **account ID** creates an updatable contract that changes when the referenced account's contract is updated. Choose based on whether you want your FT contract to be updatable or permanent.

***

## Creating a Token with a Factory

You can also create a Fungible Token by interacting with a factory contract, to which you provide the owner, initial supply, and token metadata. The factory will automatically deploy and initialize a [canonical FT contract](https://github.com/near-examples/FT).

| Network | Factory | Token account |
| - | - | - |
| Mainnet | `token.primitives.near` | `<symbol>.token.primitives.near` |
| Testnet | `token.primitives.testnet` | `<symbol>.token.primitives.testnet` |

Both factories expose `get_required` and `create_token`, and both methods take `{ args }` on either network. The token account is the symbol in lowercase, e.g. `TTTEST` becomes `tttest.token.primitives.near`, so pick a symbol that has not been taken yet.

> [accordion] Manual Interaction
>
> Creating a token takes two steps: call `get_required` to quote the storage deposit (which depends on the metadata size, including the required icon), then call `create_token` attaching that amount. `total_supply` is a string in the smallest token units: multiply the number of whole tokens by 10^decimals.
>
> > [tab] 🌐 WebApp
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { useNearWallet } from "@/components/near-provider";
> > import { NetworkId as network } from "@/config";
> >
> > const FACTORY = { mainnet: 'token.primitives.near', testnet: 'token.primitives.testnet' };
> >
> > const { signedAccountId: accountId, viewFunction, callFunction } = useNearWallet();
> > const contractId = FACTORY[network];
> >
> > const args = {
> >   owner_id: accountId,
> >   total_supply: '1000000000',
> >   metadata: {
> >     spec: 'ft-1.0.0',
> >     name: 'Test Token',
> >     symbol: 'TTTEST',
> >     icon: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
> >     decimals: 18,
> >   },
> > };
> >
> > // 1. Quote the required deposit
> > const deposit = await viewFunction({
> >   contractId,
> >   method: 'get_required',
> >   args: { args },
> > });
> >
> > // 2. Create the token
> > await callFunction({
> >   contractId,
> >   method: 'create_token',
> >   args: { args },
> >   gas: '300000000000000',
> >   deposit,
> > });
> > ```
> >
> > Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application
>
> > [tab] 🖥️ CLI
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > # Mainnet: quote, then create
> > near contract call-function as-read-only token.primitives.near get_required \
> >   json-args '{"args":{"owner_id":"bob.near","total_supply":"1000000000","metadata":{"spec":"ft-1.0.0","name":"Test Token","symbol":"TTTEST","icon":"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7","decimals":18}}}' \
> >   network-config mainnet now
> >
> > near contract call-function as-transaction token.primitives.near create_token \
> >   json-args '{"args":{"owner_id":"bob.near","total_supply":"1000000000","metadata":{"spec":"ft-1.0.0","name":"Test Token","symbol":"TTTEST","icon":"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7","decimals":18}}}' \
> >   prepaid-gas '300.0 Tgas' attached-deposit '<quoted-deposit> yoctoNEAR' \
> >   sign-as bob.near network-config mainnet sign-with-keychain send
> > ```
>
> > [tab] Lantstool
> >
> > Try it out on
> > [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/ft/create-ft-via-factory.json)

***

## Querying Metadata

You can query the FT's metadata by calling the `ft_metadata`.

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const TOKEN_CONTRACT_ADDRESS = 'token.v2.ref-finance.near';
>
> const { viewFunction } = useNearWallet();
>
> await viewFunction({
>   method: 'ft_metadata',
>   args: {},
>   contractId: TOKEN_CONTRACT_ADDRESS,
> });
> ```
>
> > [accordion] Example response
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "spec": "ft-1.0.0",
> >   "name": "Ref Finance Token",
> >   "symbol": "REF",
> >   "icon": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='16 24 248 248' style='background: %23000'%3E%3Cpath d='M164,164v52h52Zm-45-45,20.4,20.4,20.6-20.6V81H119Zm0,18.39V216h41V137.19l-20.6,20.6ZM166.5,81H164v33.81l26.16-26.17A40.29,40.29,0,0,0,166.5,81ZM72,153.19V216h43V133.4l-11.6-11.61Zm0-18.38,31.4-31.4L115,115V81H72ZM207,121.5h0a40.29,40.29,0,0,0-7.64-23.66L164,133.19V162h2.5A40.5,40.5,0,0,0,207,121.5Z' fill='%23fff'/%3E%3Cpath d='M189 72l27 27V72h-27z' fill='%2300c08b'/%3E%3C/svg%3E%0A",
> >   "reference": null,
> >   "reference_hash": null,
> >   "decimals": 18
> > }
> > ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view token.v2.ref-finance.near ft_metadata
> ```
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   spec: "ft-1.0.0",
> >   name: "Ref Finance Token",
> >   symbol: "REF",
> >   icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='16 24 248 248' style='background: %23000'%3E%3Cpath d='M164,164v52h52Zm-45-45,20.4,20.4,20.6-20.6V81H119Zm0,18.39V216h41V137.19l-20.6,20.6ZM166.5,81H164v33.81l26.16-26.17A40.29,40.29,0,0,0,166.5,81ZM72,153.19V216h43V133.4l-11.6-11.61Zm0-18.38,31.4-31.4L115,115V81H72ZM207,121.5h0a40.29,40.29,0,0,0-7.64-23.66L164,133.19V162h2.5A40.5,40.5,0,0,0,207,121.5Z' fill='%23fff'/%3E%3Cpath d='M189 72l27 27V72h-27z' fill='%2300c08b'/%3E%3C/svg%3E%0A",
> >   reference: null,
> >   reference_hash: null,
> >   decimals: 18
> > }
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/ft/query-ft-metadata.json)

***

## Checking Balance

To know how many coins a user has you will need to query the method `ft_balance_of`.

> [tab] 🌐 WebApp
>
> > [!NOTE]
> >
> > Remember about fungible token precision. You may need this value to show a response of balance requests in an understandable-to-user way in your app. How to get precision value (decimals) you may find [here](#querying-metadata).
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const TOKEN_CONTRACT_ADDRESS = 'token.v2.ref-finance.near';
>
> const { viewFunction } = useNearWallet();
>
> await viewFunction({
>   method: 'ft_balance_of',
>   args: {
>     account_id: 'bob.near',
>   },
>   contractId: TOKEN_CONTRACT_ADDRESS,
> });
> ```
>
> > [accordion] Example response
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > "3479615037675962643842"
> > ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view token.v2.ref-finance.near ft_balance_of '{"account_id": "bob.near"}'
> ```
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > '376224322825327177426'
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/ft/check-ft-balance.json)

***

## Registering a User

In order for a user to own and transfer tokens they need to first **register** in the contract. This is done by calling `storage_deposit` and attaching 0.00125Ⓝ.

By calling this `storage_deposit` the user can register themselves or **register other users**.

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const TOKEN_CONTRACT_ADDRESS = 'token.v2.ref-finance.near';
>
> const { callFunction } = useNearWallet();
>
> await callFunction({
>   contractId: TOKEN_CONTRACT_ADDRESS,
>   method: 'storage_deposit',
>   args: {
>     account_id: 'alice.near',
>   },
>   deposit: 1250000000000000000000,
> });
> ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call token.v2.ref-finance.near storage_deposit '{"account_id": "alice.near"}' --depositYocto 1250000000000000000000 --useAccount bob.near
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/ft/register-user.json)

> [!NOTE]
>
> You can make sure a user is registered by calling `storage_balance_of`.

> [!TIP]
>
> After a user calls the `storage_deposit` the FT will appear in their Wallets.

***

## Transferring Tokens

To send FT to another account you will use the `ft_transfer` method, indicating the receiver and the amount of FT you want to send.

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const TOKEN_CONTRACT_ADDRESS = 'token.v2.ref-finance.near';
>
> const { callFunction } = useNearWallet();
>
> await callFunction({
>   contractId: TOKEN_CONTRACT_ADDRESS,
>   method: 'ft_transfer',
>   args: {
>     receiver_id: 'alice.near',
>     amount: '100000000000000000',
>   },
>   deposit: 1,
> });
> ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call token.v2.ref-finance.near ft_transfer '{"receiver_id": "alice.near", "amount": "100000000000000000"}' --depositYocto 1 --useAccount bob.near
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/ft/transfer-tokens.json)

> [tab] 📄 Contract
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> #[near]
> impl Contract {
>   #[payable]
>   pub fn send_tokens(&mut self, receiver_id: AccountId, amount: U128) -> Promise {
>     assert_eq!(env::attached_deposit(), 1, "Requires attached deposit of exactly 1 yoctoNEAR");
>
>     let promise = ext(self.ft_contract.clone())
>       .with_attached_deposit(YOCTO_NEAR)
>       .ft_transfer(receiver_id, amount, None);
>
>     return promise.then( // Create a promise to callback query_greeting_callback
>       Self::ext(env::current_account_id())
>       .with_static_gas(Gas(30*TGAS))
>       .external_call_callback()
>     )
>   }
>
>   #[private] // Public - but only callable by env::current_account_id()
>   pub fn external_call_callback(&self, #[callback_result] call_result: Result<(), PromiseError>) {
>     // Check if the promise succeeded
>     if call_result.is_err() {
>       log!("There was an error contacting external contract");
>     }
>   }
> }
> ```
>
> *This snippet assumes that the contract is already holding some FTs and that you want to send them to another account.*

***

## Attaching FTs to a Call

Natively, only NEAR tokens (Ⓝ) can be attached to a function calls. However, the FT standard enables to **attach fungible tokens** in a call by using the FT-contract as intermediary.

This means that, instead of you attaching tokens directly to the call, you ask the FT-contract to do both a transfer and a function call in your name.

Let's assume that you need to deposit FTs on [Rhea Finance](https://rhea.finance/).

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const TOKEN_CONTRACT_ADDRESS = 'token.v2.ref-finance.near';
>
> const { callFunction } = useNearWallet();
>
> await callFunction({
>   contractId: TOKEN_CONTRACT_ADDRESS,
>   method: 'ft_transfer_call',
>   args: {
>     receiver_id: 'v2.ref-finance.near',
>     amount: '100000000000000000',
>     msg: '',
>   },
>   gas: 300000000000000,
>   deposit: 1,
> });
> ```
>
> > [accordion] Example response
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > "100000000000000000"
> > ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call token.v2.ref-finance.near ft_transfer_call '{"receiver_id": "v2.ref-finance.near", "amount": "100000000000000000", "msg": ""}' --gas 300000000000000 --depositYocto 1 --useAccount bob.near
> ```
>
> > [accordion] Example response
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > '100000000000000000'
> > ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/ft/attach-ft-to-call.json)

> [tab] 📄 Contract
>
> ```rust theme={"theme":{"light":"github-light","dark":"github-dark"}}
> #[payable]
> pub fn call_with_attached_tokens(&mut self, receiver_id: AccountId, amount: U128) -> Promise {
>   assert_eq!(env::attached_deposit(), 1, "Requires attached deposit of exactly 1 yoctoNEAR");
>
>   let promise = ext(self.ft_contract.clone())
>     .with_static_gas(Gas(150*TGAS))
>     .with_attached_deposit(YOCTO_NEAR)
>     .ft_transfer_call(receiver_id, amount, None, "".to_string());
>
>   return promise.then( // Create a promise to callback query_greeting_callback
>     Self::ext(env::current_account_id())
>     .with_static_gas(Gas(100*TGAS))
>     .external_call_callback()
>   )
> }
> ```

How it works:

1. You call `ft_transfer_call` in the FT contract passing: the receiver, a message, and the amount.
2. The FT contract transfers the amount to the receiver.
3. The FT contract calls `receiver.ft_on_transfer(sender, msg, amount)`
4. The FT contract handles errors in the `ft_resolve_transfer` callback.
5. The FT contract returns you how much of the attached amount was actually used.

***

## Handling Deposits

If you want your contract to handle deposit in FTs you have to implement the `ft_on_transfer` method. When executed, such method will know:

* Which FT was transferred, since it is the predecessor account.
* Who is sending the FT, since it is a parameter
* How many FT were transferred, since it is a parameter
* If there are any parameters encoded as a message

The `ft_on_transfer` must return how many FT tokens have to **be refunded**, so the FT contract gives them back to the sender.

Here is an example from our [auctions tutorial](https://docs.near.org/web3-apps/tutorials/mastering-near/3.2-ft.md) where we implement `ft_on_transfer` to handle bids in FTs:

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
    require!(
        env::block_timestamp() < self.auction_end_time.into(),
        "Auction has ended"
    );

    let ft = env::predecessor_account_id();
    require!(ft == self.ft_contract, "The token is not supported");

    // Last bid
    let Bid {
        bidder: last_bidder,
        bid: last_bid,
    } = self.highest_bid.clone();

    // Check if the deposit is higher than the current bid
    require!(amount > last_bid, "You must place a higher bid");

    // Update the highest bid
    self.highest_bid = Bid {
        bidder: sender_id,
        bid: amount,
    };

    // Transfer FTs back to the last bidder
    ft_contract::ext(self.ft_contract.clone())
        .with_attached_deposit(NearToken::from_yoctonear(1))
        .with_static_gas(Gas::from_tgas(30))
        .ft_transfer(last_bidder, last_bid);

    U128(0)
}
```

[See code on GitHub](https://github.com/near-examples/auctions-tutorial/blob/4678765ea7f2a584b1a6569786d497dcf75f5261/contract-rs/03-bid-with-fts/src/lib.rs#L56-L87)

*Note: The [`near_contract_standards::fungible_token::receiver`](https://docs.rs/near-contract-standards/latest/near_contract_standards/fungible_token/receiver/trait.FungibleTokenReceiver.html) module exposes a `FungibleTokenReceiver` trait that you could implement on your contract*

***

## Burn Tokens

While the FT standard does not define a `burn` method, you can simply transfer tokens to an account that no one controls, such as [`0000000000000000000000000000000000000000000000000000000000000000`](https://nearblocks.io/es/address/0000000000000000000000000000000000000000000000000000000000000000) (64 zeros).

> [tab] 🌐 WebApp
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useNearWallet } from "@/components/near-provider";
>
> const { callFunction } = useNearWallet();
>
> await callFunction({
>   contractId: 'token.v2.ref-finance.near',
>   method: 'ft_transfer',
>   args: {
>     receiver_id: '0000000000000000000000000000000000000000000000000000000000000000',
>     amount: '100000000000000000',
>   },
>   deposit: 1,
> });
> ```
>
> Learn more about setting up the [NEAR provider](https://docs.near.org/web3-apps/quickstart.md#context-provider) in your application

> [tab] 🖥️ CLI
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call token.v2.ref-finance.near ft_transfer '{"receiver_id": "0000000000000000000000000000000000000000000000000000000000000000", "amount": "100000000000000000"}' --depositYocto 1 --useAccount bob.near
> ```

***

## Additional Application Behavior

Use the global FT contract by default. Only if your application truly requires behavior it does not provide, use [`near-contract-standards`](https://github.com/near/near-sdk-rs/tree/master/near-contract-standards) or [`near-sdk-contract-tools`](https://docs.near.org/primitives/ft/sdk-contract-tools) for the token implementation. Keep balances, transfers, storage management, and transfer resolution in these libraries; do not implement the FT standard by hand.

## Additional Resources

1. [NEP-141 standard](https://github.com/near/NEPs/tree/master/neps/nep-0141.md)
2. [NEP-148 standard](https://github.com/near/NEPs/tree/master/neps/nep-0148.md)
3. [FT Event Standards](https://github.com/near/NEPs/blob/master/neps/nep-0300.md)
4. [FT reference implementation](https://github.com/near-examples/FT)
5. [FT with Contract Tools](https://docs.near.org/primitives/ft/sdk-contract-tools.md) - library-provided token functionality when a global contract cannot meet the application’s needs.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.