> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Staking NEAR Tokens

> Learn how to stake NEAR, delegate to validators, track rewards, and withdraw staked tokens safely.

You can delegate NEAR tokens to a validator to help secure the network and earn staking rewards.

This tutorial shows you how to stake tokens, check balances, unstake, and withdraw using the [NEAR CLI](https://docs.near.org/tools/cli.md).

> [!NOTE]
>
> **Contract source code**
>
> You can review the Staking pool smart contract source code in [this GitHub repository](https://github.com/near/core-contracts/tree/master/staking-pool).

***

## Delegate NEAR tokens

Before delegating, you need to choose a validator (a node that participates in staking).

Check [NearBlocks](https://nearblocks.io/node-explorer), [Pikespeak](https://pikespeak.ai/validators/overview) or [Near Staking](https://near-staking.com/), and look for validators with a good track record, uptime, and reasonable commission rates.

> [accordion] List validators using CLI
>
> If you prefer, you can get the list of current validators by using the [`near-validator`](https://docs.near.org/tools/cli#validator-extension) CLI:
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near-validator validators network-config mainnet now
> ```

### Stake Tokens

> [tab] Staking CLI
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near staking delegation <user-account.near> deposit-and-stake '100 NEAR' <my_validator> network-config mainnet sign-with-keychain
> ```

> [tab] Function Call
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call <my_validator> deposit_and_stake --useAccount <user-account.near> --deposit 100
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/deposit-and-stake.json)

> [!TIP]
>
> You will start earning staking rewards after the next epoch

### Staked Balance

To check your staked balance on the `<my_validator>` pool for the `<user-account.near>` account, run the following command:

> [tab] Staking CLI
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near staking delegation <user-account.near> view-balance <my_validator> network-config mainnet now
> ```

> [tab] Function Call
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view <my_validator> get_account_staked_balance '{"account_id": "<user-account.near>"}'
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/account-staked-balance.json)

> [accordion] Staking pool balances
>
> You can view additional information and balances from the staking pool using the following CLI commands:
>
> #### Total staked balance of the entire pool
>
> > [tab] 🖥️ CLI
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near view <my_validator> get_total_staked_balance '{}'
> > ```
>
> > [tab] Lantstool
> >
> > Try it out on
> > [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/pool-total-staked-balance.json)
>
> #### Owner of the staking pool
>
> > [tab] 🖥️ CLI
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near view <my_validator> get_owner_id '{}'
> > ```
>
> > [tab] Lantstool
> >
> > Try it out on
> > [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/pool-owner.json)
>
> #### Current reward fee
>
> > [tab] 🖥️ CLI
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near view <my_validator> get_reward_fee_fraction '{}'
> > ```
>
> > [tab] Lantstool
> >
> > Try it out on
> > [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/reward-fee.json)
>
> #### Owner's balance
>
> > [tab] 🖥️ CLI
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near view <my_validator> get_account_total_balance '{"account_id": "owner"}'
> > ```
>
> > [tab] Lantstool
> >
> > Try it out on
> > [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/owner-balance.json)
>
> #### Staking key
>
> > [tab] 🖥️ CLI
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near view <my_validator> get_staking_key '{}'
> > ```
>
> > [tab] Lantstool
> >
> > Try it out on
> > [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/staking-key.json)

***

## Withdrawing Staked Tokens

To withdraw your staked tokens, you will first need to "un-delegate" them from the validator.

Your tokens will enter a 4-epoch unbonding period before they can be withdrawn.

### Unstake Tokens

> [tab] Staking CLI
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near staking delegation <user-account.near> unstake '1 NEAR' <my_validator> network-config mainnet sign-with-keychain
> ```
>
> > [!NOTE]
> >
> > Use the `unstake-all` command to unstake all tokens at once:
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near staking delegation <user-account.near> unstake-all <my_validator> network-config mainnet sign-with-keychain
> > ```

> [tab] Function Call
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call <my_validator> unstake '{"amount": "100000000000000000000000000"}' --useAccount <user-account.near>
> ```
>
> > [!NOTE]
> >
> > Call the `unstake_all` method to unstake all tokens at once

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/unstake.json)

### Query Unstaked Balance

> [tab] Staking CLI
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near staking delegation <user-account.near> view-balance <my_validator> network-config mainnet now
> ```

> [tab] Function Call
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near view <my_validator> get_account_unstaked_balance '{"account_id": "<user-account.near>"}'
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/account-unstaked-balance.json)

### Withdraw Tokens

Once the unbonding period has passed, you can withdraw your unstaked tokens:

> [tab] Staking CLI
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near staking delegation <user-account.near> withdraw '1 NEAR' <my_validator> network-config mainnet sign-with-keychain
> ```
>
> > [!NOTE]
> >
> > If you want to withdraw all available tokens, you can use the `withdraw-all` command:
> >
> > ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > near staking delegation <user-account.near> withdraw-all <my_validator> network-config mainnet sign-with-keychain
> > ```

> [tab] Function Call
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> near call <my_validator> withdraw '{"amount": "100000000000000000000000000"}' --useAccount <user-account.near>
> ```

> [tab] Lantstool
>
> Try it out on
> [Lantstool](https://app.lantstool.dev/import/gh/lantstool/examples.near-protocol/main/docs/2.build/5.primitives/staking/withdraw-unstaked-tokens.json)

***

## Tools and Resources

* Supported wallets for staking and managing your tokens:
  * [Ecosystem Wallets](https://wallet.near.org/)
* To explore validators and staking pools:
  * [NearBlocks](https://nearblocks.io/)
  * [Pikespeak](https://pikespeak.ai/)
  * [NEAR Staking](https://near-staking.com/)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.