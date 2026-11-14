> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Rust

> Use the Rust SDK for verified Chat Completions, Responses, Messages, and System One decisions.

## Install

The SDK is available on [crates.io](https://crates.io/crates/nearai-inference-sdk). Use Rust stable and Cargo. Add the SDK to your application:

```bash theme={"dark"}
cargo add nearai-inference-sdk
```

Set your API key in your server environment:

```bash theme={"dark"}
export NEARAI_API_KEY="your-api-key"
```

## Examples

Choose the tab matching your model's API. These examples assume a project with Tokio and serde\_json; use them in `src/main.rs`.

> [tab] Chat Completions
>
> Call a supported NEAR TEE model with E2EE enabled, then verify the completion.
>
> ```rust theme={"dark"}
> use nearai_inference_sdk::{InferenceClient, InferenceClientOptions};
> use serde_json::json;
>
> #[tokio::main]
> async fn main() -> Result<(), Box<dyn std::error::Error>> {
>     let client = InferenceClient::with_options(InferenceClientOptions {
>         api_key: Some(std::env::var("NEARAI_API_KEY")?),
>         e2ee: true,
>         ..Default::default()
>     })?;
>     let completion = client.chat_completions(json!({
>         "model": "z-ai/glm-5.3-flash",
>         "messages": [{"role": "user", "content": "Hello!"}]
>     })).await?;
>
>     // Verify the exact request and response bytes before using the answer.
>     let id = completion["id"].as_str().ok_or("Completion has no ID")?;
>     let verified = client.verify_response(id).await?;
>     println!("Verified {:?} response", verified.signature_kind());
>     println!("{}", completion["choices"][0]["message"]["content"]);
>     Ok(())
> }
> ```

> [tab] Responses
>
> Use a Responses model with `store: false` and E2EE disabled. See [Stateless Responses](https://docs.near.ai/cloud/guides/stateless-responses.md) for conversation history and tool calls.
>
> ```rust theme={"dark"}
> use nearai_inference_sdk::{InferenceClient, InferenceClientOptions};
> use serde_json::json;
>
> #[tokio::main]
> async fn main() -> Result<(), Box<dyn std::error::Error>> {
>     let client = InferenceClient::with_options(InferenceClientOptions {
>         api_key: Some(std::env::var("NEARAI_API_KEY")?),
>         base_url: "https://cloud-api.near.ai/v1".into(),
>         e2ee: false,
>         ..Default::default()
>     })?;
>     let response = client.create_response(json!({
>         "model": r#"openai/gpt-6-astra"#,
>         "input": "Hello!",
>         "store": false
>     })).await?;
>
>     // Verify before displaying the answer.
>     let id = response["id"].as_str().ok_or("response has no ID")?;
>     let verified = client.verify_response(id).await?;
>     println!("{}", response["output"]);
>     println!("Verified signer: {:?}", verified.signature_kind());
>     Ok(())
> }
> ```

> [tab] Messages
>
> Call an Anthropic model through the Messages API with E2EE disabled.
>
> ```rust theme={"dark"}
> use nearai_inference_sdk::{InferenceClient, InferenceClientOptions};
> use serde_json::json;
>
> #[tokio::main]
> async fn main() -> Result<(), Box<dyn std::error::Error>> {
>     let client = InferenceClient::with_options(InferenceClientOptions {
>         api_key: Some(std::env::var("NEARAI_API_KEY")?),
>         base_url: "https://cloud-api.near.ai/v1".into(),
>         e2ee: false,
>         ..Default::default()
>     })?;
>     let response = client.create_message(json!({
>         "model": r#"anthropic/claude-opus-4-6"#,
>         "max_tokens": 128,
>         "messages": [{"role": "user", "content": "Hello!"}]
>     })).await?;
>
>     // Verify before displaying the answer.
>     let id = response["id"].as_str().ok_or("message has no ID")?;
>     let verified = client.verify_response(id).await?;
>     println!("{}", response["content"]);
>     println!("Verified signer: {:?}", verified.signature_kind());
>     Ok(())
> }
> ```

> [tab] System One
>
> Ask Jev a structured question with E2EE and OHTTP disabled.
>
> ```rust theme={"dark"}
> use nearai_inference_sdk::{InferenceClient, InferenceClientOptions};
> use serde_json::json;
>
> #[tokio::main]
> async fn main() -> Result<(), Box<dyn std::error::Error>> {
>     let client = InferenceClient::with_options(InferenceClientOptions {
>         api_key: Some(std::env::var("NEARAI_API_KEY")?),
>         base_url: "https://cloud-api.near.ai/v1".into(),
>         e2ee: false,
>         ohttp: false,
>         ..Default::default()
>     })?;
>     let result = client.systemone_create(&json!({
>         "model": r#"typesafe/jev-1.13"#,
>         "state": {"message": "I was charged twice. Please help."},
>         "questions": {
>             "billing": {"type": "noul", "instructions": "Is this about billing?"}
>         }
>     })).await?;
>
>     // decision_id is captured from X-Generation-Id.
>     let verified = client.verify_response(&result.decision_id).await?;
>     println!("{}", serde_json::to_string_pretty(&result.data.answers)?);
>     println!("Verified signer: {:?}", verified.signature_kind());
>     Ok(())
> }
> ```

## E2EE

End-to-end encryption is disabled by default. Set `e2ee: true` to encrypt supported Chat fields to a verified model key and decrypt the response automatically.

E2EE requires a NEAR vLLM model with attestation enabled. Other providers use Gateway-only verification; set `e2ee: false` for those models.

## Verification

Before sending Chat, the client verifies the Gateway and every returned model report for supported models. Gateway TLS identity verification is enabled by default and subsequent requests are pinned to that identity. Normal HTTPS certificate validation remains enabled. Failed required checks stop the request.

Response-signature verification is explicit: call `client.verify_response(id).await?` after receiving the completion. The client retains the exact request and response bytes automatically, including encrypted wire bytes when E2EE is enabled.

See [Verification](https://docs.near.ai/cloud/inference-sdk#verification) for receipt IDs and signature kinds.

Response records expire 60 minutes after the full response is read, by default. Verify each response before its record expires.

To check a deployment without sending a prompt, call `client.verify(model).await?`. For custom policies and cache settings, see the [Rust verification guide](https://github.com/nearai/inference-sdk/blob/main/rs/docs/verification-guide.md).

### Streaming and HTTP transport

Use `chat_request()` with `"stream": true`, then `send(reqwest::Request)` to obtain an `InferenceResponse`. Consume its `body` through HTTP EOF, including bytes after SSE `[DONE]`, before calling `verify_response()` with the completion ID from an SSE data event. Dropping a partial stream leaves no verifiable receipt. Output displayed before verification succeeds is not yet signature-verified.

Rust exposes its own reqwest transport API rather than an OpenAI SDK adapter. Body chunks are SSE bytes and need not correspond to complete events or UTF-8 strings. The [streaming guide](https://github.com/nearai/inference-sdk/blob/main/rs/docs/verification-guide.md#streaming) and [Gateway client example](https://github.com/nearai/inference-sdk/blob/main/examples/example-rs/src/gateway/chat_completions.rs) show how to consume responses and verify receipts. Use `create_response()` for Responses JSON, or `response_request()` with `send()` for Responses streaming.

## OHTTP

Set `ohttp: true` when constructing the client to encapsulate the Chat HTTP exchange to the attested Gateway:

```rust theme={"dark"}
let client = InferenceClient::with_options(InferenceClientOptions {
    api_key: Some(std::env::var("NEARAI_API_KEY")?),
    e2ee: true,
    ohttp: true,
    ..Default::default()
})?;
```

Use these options in the completion example above. OHTTP requires the default Ed25519 algorithm and cannot be used with `SigningAlgo::Ecdsa`. E2EE is configured independently. Missing or invalid Gateway OHTTP evidence blocks Chat.

> [!NOTE]
>
> OHTTP supports Chat Completions, Responses, and Messages through the Gateway; System One does not support OHTTP. Attestation and signature requests remain regular HTTPS. The endpoint must expose `/ohttp` at the same origin. Outer authorization headers and the client's network address are not hidden by OHTTP.

## Examples and reference

* [Rust verification guide](https://github.com/nearai/inference-sdk/blob/main/rs/docs/verification-guide.md): policies, encryption, streaming, TLS binding, and errors.
* [Rust API reference](https://github.com/nearai/inference-sdk/blob/main/rs/docs/api-reference.md): client options, verification functions, defaults, and result fields.
* [Runnable Rust examples](https://github.com/nearai/inference-sdk/tree/main/examples/example-rs): Gateway and direct clients, standalone verification, and JSON/SSE.

For experimental direct endpoints, see the [direct-client guide](https://docs.near.ai/cloud/inference-sdk/direct.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.