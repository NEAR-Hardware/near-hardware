> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Yield and Resume

> Wait for an external response and resume execution

NEAR smart contracts can **yield** execution, until an **external** service **resumes** them. In practice, the contract yields a **cross-contract call** to itself, until an external service executes a function and the contract decides to resume.

This allows contracts to wait for external events, such as a response from an oracle, before continuing execution.

> [!NOTE]
>
> This example uses `near-sdk` 5.29.1. The contract can wait for 200 blocks, after which the yielded function executes with a timeout error if no response has arrived.

***

## Yielding a Promise

Let's look at an example that takes a prompt from a user (e.g. "What is 2+2"), and yields the execution until an external service provides a response.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
pub fn request(&mut self, prompt: String) -> Promise {
    // internal variable to keep track of the requests
    self.request_id += 1;

    // create the yielded promise and its resumption ID
    let (yield_promise, yield_id) = Promise::new_yield(
        "return_external_response",
        &json!({ "request_id": self.request_id })
            .to_string()
            .into_bytes(),
        Gas::from_tgas(5),
        GasWeight::default(),
    );

    // store the request, so we can delete it later
    let request = Request { yield_id, prompt };
    self.requests.insert(self.request_id, request);

    // return the yield promise
    yield_promise
}
```

[See code on GitHub](https://github.com/near-examples/yield-resume/blob/0b00fa1a672131b396138f4794e085501c172bb5/contract/src/lib.rs#L41-L61)

#### Creating a Yielded Promise

In the example above, we are creating a [`Promise`](https://docs.near.org/smart-contracts/anatomy/crosscontract#promises) to call the contract's function `return_external_response`.

`Promise::new_yield` returns both the yielded `Promise` and a `YieldId` that identifies it. The callback name, arguments, and gas allocation are passed when creating the promise.

#### Storing the Yielded Promise ID

We store the `yield_id` and the user's `prompt` so the external service can query them using `list_requests`. A `YieldId` is serialized as a base64 string in JSON; the service passes that value unchanged when responding.

#### Returning the Promise

Finally, we return the `Promise` from `request`. The callback will **not execute immediately**: it waits until the external service provides a response or the promise times out.

> [accordion] What is that `self.request_id` in the code?
>
> The `self.request_id` is an internal unique identifier that we use to keep track of stored requests. This way, we can delete the request once the external service provides a response (or the wait times out)
>
> Since we only use it to simplify the process of keeping track of the requests, you can remove it if you have a different way of tracking requests (e.g. an indexer)

***

## Signaling the Resume

The `YieldId::resume` method allows us to signal which yielded promise should execute and pass a response to the callback.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
pub fn respond(&mut self, yield_id: YieldId, response: String) {
    // resume computation with the response
    yield_id
        .resume(serde_json::to_vec(&response).unwrap())
        .expect("yielded promise not found or already resolved");
}
```

[See code on GitHub](https://github.com/near-examples/yield-resume/blob/0b00fa1a672131b396138f4794e085501c172bb5/contract/src/lib.rs#L63-L68)

In the example above, an external service calls `respond`, passing the `yield_id` from `list_requests` and the response to the prompt. The response is serialized as JSON bytes so the callback can deserialize it as a `String`.

`YieldId::resume` returns an error if the yielded promise is no longer available. In this example, `expect` makes `respond` fail in that case, such as when a response arrives after the timeout callback has completed.

> [!WARNING]
>
> **Gatekeeping the Resume**
>
> Since the function used to signal the resume is public, developers must make sure to guard it properly to avoid unwanted calls. This can be done by simply checking the caller of the function

***

## The Function that Resumes

The callback receives the arguments passed when creating the yielded promise and the result of waiting for the external response.

```rust title="lib.rs" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
#[private]
pub fn return_external_response(
    &mut self,
    request_id: u32,
    #[callback_result] response: Result<String, PromiseError>,
) -> Response {
    self.requests.remove(&request_id);

    match response {
        Ok(answer) => Response::Answer(answer),
        Err(_) => Response::TimeOutError,
    }
}
```

[See code on GitHub](https://github.com/near-examples/yield-resume/blob/0b00fa1a672131b396138f4794e085501c172bb5/contract/src/lib.rs#L70-L82)

In the example above, the `return_external_response` receives parameters:

1. A `request_id` - passed on [creation](#creating-a-yielded-promise) - which is used to remove the request from the state
2. A `response` - obtained through `#[callback_result]` - which is `Ok(answer)` when the external service [signals the resume](#signaling-the-resume), or `Err(PromiseError::Failed)` if the promise times out while waiting

> [!TIP]
>
> **There's plenty of time**
>
> The contract can wait for 200 blocks before timing out.

> [!NOTE]
>
> In this example, we return `Response::Answer` when there is a response and `Response::TimeOutError` when the callback receives an error.
>
> Both paths remove the stored request. Panicking in the callback would revert that removal, so we return a value to preserve the cleanup.

***

## Managing State

When using yield and resume, it's important that you carefully manage the contract's state. The function that creates the yielded promise finishes before the callback executes, and its state changes are already committed.

If you change the state of the contract in the function where you yield the promise (the `request` function here), then you need to make sure that you clean up the pending state in the function that resumes (the `return_external_response` function here) in the case that the promise times out or the response is invalid.

It is best practice to check the validity of the response within the function where the resume is signaled (the `respond` function here) and panic if the response is not valid; the external service can attempt to respond again before the promise times out. You should not panic in `return_external_response` as this is only called when the promise has been resolved (it was resumed or timed out), meaning it can't be resumed again, and the state changes made in `request` have already been committed. You should gracefully complete the callback and clean up the pending state.

> [!NOTE]
>
> Read [asynchronous-call security](https://docs.near.org/smart-contracts/security/cross-contract-calls/callbacks.md) to avoid common pitfalls when dealing with callbacks and pending state.

## Testing Yield and Resume

The [example's sandbox tests](https://github.com/near-examples/yield-resume/blob/main/contract/tests/yield_resume.rs) build the contract from source and use `near-sandbox` with `near-api` to verify both an external response and a timeout. The timeout test fast-forwards the local node. Both tests check that pending requests are removed and that completed requests cannot be resumed again.

From the repository's `contract` directory, run:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
cargo install cargo-near --version 0.21.1 --locked --no-default-features
cargo test --locked
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.