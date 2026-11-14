> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# OpenAI Compatibility

> How to use NEAR AI Cloud with standard OpenAI SDKs

NEAR AI Cloud implements the OpenAI-compatible inference surfaces documented below. You can use the official OpenAI client libraries for Python and JavaScript/TypeScript by changing the base URL and API key. Features that require provider-side storage or tool execution are intentionally limited; each section describes the supported contract.

## Configuration

To use the OpenAI SDKs with NEAR AI Cloud, you simply need to override the `base_url` and provide your NEAR AI `api_key`.

To add attestation and response-signature verification, connect the official client through the [NEAR AI Inference SDK](https://docs.near.ai/cloud/inference-sdk).

### Base URL

Use the NEAR AI Cloud Gateway base URL:

```
https://cloud-api.near.ai/v1
```

### API Key

You can generate your API key in the [NEAR AI Cloud Dashboard](https://cloud.near.ai/dashboard/organizations).

### Request IDs

Gateway responses from `https://cloud-api.near.ai/v1` include an `X-Request-Id` response header. Support may ask you for this value when debugging a request.

`X-Request-Id` is opaque support/debugging metadata; it is not W3C `traceparent` or distributed trace context. If you send your own `X-Request-Id`, use a non-sensitive UUID value. `X-Request-Id` values must not contain secrets or PII. `X-Org-Id` and `X-Workspace-Id` are internal tenant headers; public clients cannot set or override them.

## Usage Examples

> [tab] Python
>
> ### Python SDK
>
> First, install the OpenAI Python library:
>
> ```bash theme={"dark"}
> pip install openai
> ```
>
> Then, initialize the client with NEAR AI configuration:
>
> ```python theme={"dark"}
> from openai import OpenAI
>
> client = OpenAI(
>     base_url="https://cloud-api.near.ai/v1",
>     api_key="YOUR_NEAR_AI_API_KEY",
> )
>
> response = client.chat.completions.create(
>     model="zai-org/GLM-5.1-FP8",
>     messages=[
>         {"role": "system", "content": "You are a helpful assistant."},
>         {"role": "user", "content": "Explain quantum computing in simple terms."}
>     ],
>     temperature=0.7,
>     max_tokens=500
> )
>
> print(response.choices[0].message.content)
> ```
>
> ### Async Usage
>
> ```python theme={"dark"}
> import asyncio
> from openai import AsyncOpenAI
>
> client = AsyncOpenAI(
>     base_url="https://cloud-api.near.ai/v1",
>     api_key="YOUR_NEAR_AI_API_KEY",
> )
>
> async def main():
>     stream = await client.chat.completions.create(
>         model="zai-org/GLM-5.1-FP8",
>         messages=[{"role": "user", "content": "Tell me a story about space."}],
>         stream=True,
>     )
>
>     async for chunk in stream:
>         if chunk.choices[0].delta.content is not None:
>             print(chunk.choices[0].delta.content, end="")
>
> asyncio.run(main())
> ```

> [tab] JavaScript/TypeScript
>
> ### Node.js / TypeScript SDK
>
> First, install the OpenAI Node.js library:
>
> ```bash theme={"dark"}
> npm install openai
> ```
>
> Then, initialize the client with NEAR AI configuration:
>
> ```javascript theme={"dark"}
> import OpenAI from 'openai';
>
> const openai = new OpenAI({
>   baseURL: 'https://cloud-api.near.ai/v1',
>   apiKey: 'YOUR_NEAR_AI_API_KEY',
> });
>
> async function main() {
>   const completion = await openai.chat.completions.create({
>     messages: [{ role: 'user', content: 'What is the capital of France?' }],
>     model: 'zai-org/GLM-5.1-FP8',
>   });
>
>   console.log(completion.choices[0].message.content);
> }
>
> main();
> ```
>
> ### Streaming Example
>
> ```javascript theme={"dark"}
> import OpenAI from 'openai';
>
> const openai = new OpenAI({
>   baseURL: 'https://cloud-api.near.ai/v1',
>   apiKey: 'YOUR_NEAR_AI_API_KEY',
> });
>
> async function main() {
>   const stream = await openai.chat.completions.create({
>     model: 'zai-org/GLM-5.1-FP8',
>     messages: [{ role: 'user', content: 'Write a haiku about coding.' }],
>     stream: true,
>   });
>
>   for await (const chunk of stream) {
>     process.stdout.write(chunk.choices[0]?.delta?.content || '');
>   }
> }
>
> main();
> ```

## Supported Features

NEAR AI Cloud supports the following core OpenAI API features:

* **Chat Completions** (`/v1/chat/completions`) - Including tool calling, structured outputs, and [reasoning](https://docs.near.ai/cloud/reasoning-models.md)
* **Completions** (`/v1/completions`) - Legacy text completions
* **Models List** (`/v1/models`)
* **Embeddings** (`/v1/embeddings`) - See [Beyond Chat](https://docs.near.ai/cloud/guides/specialized-endpoints.md#embeddings)
* **Images** (`/v1/images/generations`, `/v1/images/edits`) - See [Beyond Chat](https://docs.near.ai/cloud/guides/specialized-endpoints.md#image-generation)
* **Audio Transcription** (`/v1/audio/transcriptions`) - See [Beyond Chat](https://docs.near.ai/cloud/guides/specialized-endpoints.md#audio-transcription)
* **Responses** (`/v1/responses`) - Stateless, `store: false` inference with client-managed history and custom functions; see [Stateless Responses](https://docs.near.ai/cloud/guides/stateless-responses.md)
* **Streaming** (Server-Sent Events)

NEAR AI Cloud also provides non-OpenAI extensions:

* **Reranking** (`/v1/rerank`) - Score documents against a query
* **Privacy classification** (`/v1/privacy/classify`) - Detect personally identifiable information through the gateway
* **Privacy redaction** (`/v1/privacy/redact`) - Gateway-only endpoint for redacting personally identifiable information
* **Attestation & Signatures** (`/v1/attestation/report`, `/v1/signature/{chat_id}`) - See [Verification](https://docs.near.ai/cloud/verification)

### Stateless Responses

The Responses API preserves the OpenAI Responses input, output, and streaming shapes without storing conversation or response history. Set `store: false` or omit it, and include any prior context in each new request.

> [tab] Python
>
> ```python theme={"dark"}
> from openai import OpenAI
>
> client = OpenAI(
>     base_url="https://cloud-api.near.ai/v1",
>     api_key="YOUR_NEAR_AI_API_KEY",
> )
>
> response = client.responses.create(
>     model="z-ai/glm-5.2",
>     input="Explain confidential inference in one sentence.",
>     store=False,
> )
>
> print(response.output_text)
> ```

> [tab] JavaScript/TypeScript
>
> ```javascript theme={"dark"}
> import OpenAI from 'openai';
>
> const openai = new OpenAI({
>   baseURL: 'https://cloud-api.near.ai/v1',
>   apiKey: 'YOUR_NEAR_AI_API_KEY',
> });
>
> async function main() {
>   const response = await openai.responses.create({
>     model: 'z-ai/glm-5.2',
>     input: 'Explain confidential inference in one sentence.',
>     store: false,
>   });
>
>   console.log(response.output_text);
> }
>
> main();
> ```

See [Stateless Responses](https://docs.near.ai/cloud/guides/stateless-responses.md) for caller-managed multi-turn history, custom function replay, retired endpoints, and unsupported server-executed tools.

## Environment Variables

Alternatively, you can set the environment variables to avoid hardcoding credentials in your code:

```bash theme={"dark"}
export OPENAI_BASE_URL="https://cloud-api.near.ai/v1"
export OPENAI_API_KEY="your-near-ai-key"
```

Then you can initialize the client without arguments:

```python theme={"dark"}
# Python
client = OpenAI()
```

```javascript theme={"dark"}
// JavaScript
const openai = new OpenAI();
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.