> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Error Handling

> Learn about common error patterns in NEAR protocol integrations and how to handle and troubleshoot issues in your applications.

Transaction submission can fail before execution, and accepted transactions can fail while their receipts execute. A timeout leaves the transaction's outcome unknown; recover using its original hash before submitting a replacement.

***

## Handling Transaction Errors

For SDK error handling, nonce errors, and timeout recovery, see [submission errors and retries](https://docs.near.org/integrations/create-transactions.md#submission-errors-and-retries). The [transaction RPC reference](https://docs.near.org/api/rpc/transactions.md) documents submission and status responses.

Actions within one receipt are atomic; separate receipts are not rolled back together. Inspect finalized receipt outcomes and account for successful movements, fees, and refunds before retrying an operation.

***

## Avoiding Token Loss

This document provides an overview of potential scenarios that can lead to token loss on the NEAR Protocol and how to mitigate these risks. It covers improper key management, refunding deleted accounts, failed asynchronous function calls, and deleting gas keys or accounts that hold gas key balances.

Token loss is possible under multiple scenarios. These scenarios can be grouped into a few related classes:

1. [Improper key management](https://docs.near.org/integrations/accounts.md#improper-key-management)
2. Refunding deleted accounts
3. Failed asynchronous function calls
4. Deleting gas keys, or accounts that hold gas key balances

> [!WARNING]
>
> Careful! Losing tokens means losing money!

***

## Refunding deleted accounts

See [refunding deleted accounts](https://docs.near.org/protocol/network/token-loss.md#refunding-deleted-accounts) for payout failures and outstanding refunds that can cause token loss.

### Deleting account with non-existent beneficiary

> [!WARNING]
>
> Never use `DeleteAccount` as a replacement for `Transfer`. Follow the [safe account deletion procedure](https://docs.near.org/protocol/network/token-loss.md#deleting-account-with-non-existent-beneficiary): transfer, wait for finalized success and outstanding refunds, then delete if needed.

### Account deleted before it receives a refund

See [account deletion with outstanding refunds](https://docs.near.org/protocol/network/token-loss.md#account-deleted-before-it-receives-a-refund).

***

## Failed asynchronous function calls

> [!WARNING]
>
> When designing a smart contract, you should always consider the asynchronous nature of NEAR Protocol.

If a contract function `f1` calls two (or more) other functions `f2` and `f3`, and at least one of these functions, `f2` and `f3` fails, then tokens will be refunded from the function that failed, but tokens will be appropriately credited to the function(s) which succeed.

These are separate receipts, not an atomic batch of actions in one receipt. A failed downstream call does not undo a previously successful transfer. Track each movement and refund before deciding whether recovery is needed.

***

## Deleting gas keys, or accounts that hold gas key balances

Only the account balance goes to the beneficiary. NEAR held in a [gas key](https://docs.near.org/protocol/accounts-contracts/gas-keys.md) is burned when you delete that gas key or the account.

* A `DeleteKey` action fails with `GasKeyBalanceTooHigh` if the gas key it deletes holds more than 1 NEAR.
* A `DeleteAccount` action fails with `GasKeyBalanceTooHigh` if all gas keys on the account hold more than 1 NEAR in total, even when each key holds less than 1 NEAR.

Balances at or below these limits are burned, not paid out. Withdraw every gas key balance with `WithdrawFromGasKey` before you delete a gas key or the account.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.