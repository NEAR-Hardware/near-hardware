---
name: near-ai
description: Use NEAR AI Cloud's private, verifiable inference from a NEAR Hardware project - the user's API key kept out of chat and git, live model list and prices, OpenAI-compatible requests (chat, responses, vision, audio, embeddings), checking TEE attestation and response signatures, and reaching it from a board.
---

# NEAR AI Cloud: private inference

NEAR AI Cloud runs open-weight models inside **trusted execution environments** (Intel TDX confidential VMs + NVIDIA confidential GPUs) behind an **OpenAI-compatible** gateway. Prompts and answers are not readable by the host, the operator or NEAR AI, and each response can be checked against a hardware attestation of the code and model that served it. Use it when a project sends something private to a model (sensor logs, camera frames, voice, a user's messages) or needs proof of which model answered.

NEAR AI is an AI company (Jasnah Inc., d/b/a NEAR AI), separate from NEAR Protocol: an API key is all you need, not a NEAR account. Its agent runtime, IronClaw, has its own skill: `near-ironclaw`.

## What the user does (you can't)

1. Create an account at https://cloud.near.ai and buy **credits** (prepaid, per-token billing; no free tier is documented). Alternative: **Staking for Inference**, where NEAR staking rewards pay for inference (1 credit = 1 USD) and the stake stays withdrawable.
2. In the console, **API Keys** → create a key. A dedicated key per project makes it easy to revoke.
3. Save it where your code reads it, **not in chat**. In the project root:

```sh
git check-ignore -q .env.local && echo ignored   # add ".env*.local" to .gitignore first if not
```

Then ask the user to put one line into `.env.local` themselves: `NEARAI_API_KEY=<their key>`.

Rules: never ask for the key in chat, never print it (`cat .env.local`, `env`, `echo $NEARAI_API_KEY`), never write it into firmware, `BOARD.md`, logs or any tracked file. A `401` means a missing or wrong key: tell the user, don't go looking at it.

Load it inside the command that uses it, so the value never appears in output:

```sh
set -a; . ./.env.local; set +a; curl -s https://cloud-api.near.ai/v1/chat/completions -H "Authorization: Bearer $NEARAI_API_KEY" …
node --env-file=.env.local relay.mjs
```

## Endpoints

Base URL `https://cloud-api.near.ai/v1`, header `Authorization: Bearer $NEARAI_API_KEY`.

| Endpoint                                     | What                                                            | Key? |
| -------------------------------------------- | --------------------------------------------------------------- | ---- |
| `GET /models`                                | Live catalog: ids, context, prices, features, modalities        | no   |
| `GET /model/list`                            | Same models with `metadata.verifiable` and `aliases`            | no   |
| `GET /attestation/report`                    | Gateway (and model) TEE attestation for your nonce              | no   |
| `POST /chat/completions`                     | Chat, tools, structured outputs, streaming, image input         | yes  |
| `POST /responses`                            | Stateless Responses API (`store: false`, you send the history)  | yes  |
| `POST /embeddings`, `/rerank`                | Embeddings, reranking                                           | yes  |
| `POST /images/generations`, `/images/edits`  | Image generation (`data[0].b64_json`)                           | yes  |
| `POST /audio/transcriptions`                 | Speech to text (`openai/whisper-large-v3`)                      | yes  |
| `POST /privacy/classify`, `/privacy/redact`  | Find or strip personal data                                     | yes  |
| `GET /signature/{id}`                        | The signature over one completion or response                   | yes  |

Every response carries an `X-Request-Id` header; support may ask for it.

## Pick a model (live, never from memory)

```sh
curl -s https://cloud-api.near.ai/v1/models | jq -r '.data[] | [.id, .owned_by, .pricing.input, .pricing.output, .context_length] | @tsv'
```

`pricing.input` / `pricing.output` are USD per 1M tokens. Readable lists with the **privacy tier** of each model: https://near.ai/models.md and https://near.ai/pricing.md (prices change; fetch them, don't quote old numbers).

| Tier             | `owned_by`      | Guarantee                                                                   |
| ---------------- | --------------- | --------------------------------------------------------------------------- |
| Private TEE      | `nearai`        | Runs in NEAR AI's enclaves; attestation and model signatures                |
| Private 3P TEE   | `attested 3p`   | Runs in a third party's attested enclave; verification depends on provider  |
| Incognito        | `anthropic`, `openai`, `google`, … | Gateway (a TEE) hides the user's account; the model runs at the provider, **no** hardware privacy |

Live on 2026-11-14 (64 models), Private TEE examples: `z-ai/glm-5.3-flash` (text + image, $0.08 in / $0.50 out), `Qwen/Qwen3.8-27B` ($0.04 / $1.35), `Qwen/Qwen3-VL-30B-A3B-Instruct` (vision), `openai/whisper-large-v3` (audio), `Qwen/Qwen3-Embedding-0.6B`, `black-forest-labs/FLUX.2-klein-4B` (images). For private data choose **Private TEE**, and say so when you pick an Incognito model.

Use the canonical `id`. Older names in the docs (`zai-org/GLM-5.1-FP8`, `z-ai/glm-5.2`) still work as **aliases** of `z-ai/glm-5.3-flash`, but an aliased request gets only a gateway signature, not the model TEE's.

## Requests

```sh
set -a; . ./.env.local; set +a
curl -s https://cloud-api.near.ai/v1/chat/completions \
  -H "Authorization: Bearer $NEARAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "z-ai/glm-5.3-flash", "max_tokens": 200, "reasoning_effort": "low",
       "messages": [{"role": "user", "content": "Room is 31.4 C, 78% humidity. One-line advice."}]}' \
  | jq -r '.choices[0].message.content'
```

GLM 5.3 Flash and the Qwen models are **reasoning** models: `message.reasoning_content` holds the thinking, billed as completion tokens. `"reasoning_effort": "low"` (or a small `thinking_token_budget`) keeps it short; on GLM 5.3 Flash `enable_thinking: false` only moves the reasoning into `content`.

Node, with the official `openai` package (`npm i openai`):

```js
import OpenAI from 'openai'

const ai = new OpenAI({ baseURL: 'https://cloud-api.near.ai/v1', apiKey: process.env.NEARAI_API_KEY })
const r = await ai.chat.completions.create({
  model: 'z-ai/glm-5.3-flash',
  response_format: { type: 'json_object' },
  messages: [{ role: 'user', content: 'Classify this reading as ok|warn|alarm, JSON {"level":…}: CO2 1840 ppm' }]
})
console.log(r.choices[0].message.content)
```

- **Features differ per model**: check `supported_features` in `/v1/models` before using tools or `response_format` (`z-ai/glm-5.3-flash` lists `tools`, `structured_outputs`, `reasoning`, `json_mode`).
- **Images** (camera boards): `image_url` content parts in the standard OpenAI chat format, on a model whose `input_modalities` includes `image`.
- **Responses API**: `ai.responses.create({ model, input, store: false })`. `store: true` is rejected; send earlier turns yourself.
- **Python**: `openai.OpenAI(base_url="https://cloud-api.near.ai/v1", api_key=os.environ["NEARAI_API_KEY"])`. Tools that read `OPENAI_BASE_URL` / `OPENAI_API_KEY` work with those set to the NEAR AI values.

## Verify the TEE

**Simplest: the official SDK**, which checks the gateway attestation before sending and the signature after: `npm i @nearai/inference-sdk` (Node 24.22.1+), `pip install nearai-inference-sdk` (Python 3.12+), `cargo add nearai-inference-sdk`, or Go.

```js
import { InferenceClient } from '@nearai/inference-sdk/node'

const client = new InferenceClient({ baseUrl: 'https://cloud-api.near.ai/v1', apiKey: process.env.NEARAI_API_KEY, e2ee: true })
const c = await client.chat.completions.create({ model: 'z-ai/glm-5.3-flash', messages: [{ role: 'user', content: 'Reply ok' }] })
const v = await client.verifyResponse(c.id) // verify before using the answer
console.log(v.signatureKind, c.choices[0].message.content) // provider_tee = signed by the model's TEE
```

`e2ee: true` also encrypts the chat fields to the verified model key (NEAR TEE models only). By hand, the user can check a model and a reply at https://cloud.near.ai/verify.

**Manual flow** (what the SDK does):

1. Before the request, with a nonce you generate (no key needed):

```sh
NONCE=$(openssl rand -hex 32)
curl -s -G https://cloud-api.near.ai/v1/attestation/report \
  --data-urlencode signing_algo=ecdsa --data-urlencode "nonce=$NONCE"
```

   You get `gateway_attestation` (`intel_quote`, `event_log`, `request_nonce`, `signing_address`, `signing_algo`, `info.tcb_info`). Add `model=<id>&provider=near` and the header `x-no-aliasing: true` to also get `model_attestations[]`. Verify the Intel TDX quote with a DCAP verifier (e.g. `dcap-qvl`), check it binds your nonce and the signing address. Checked live 2026-11-14: the report comes back without a key and echoes the nonce.
2. Send the completion with the canonical model id and `x-no-aliasing: true`; keep the **exact** request and response bytes.
3. `GET /v1/signature/<completion id>?signing_algo=ecdsa` (with key) returns `text`, `signature`, `signing_address`, `signature_kind`. For `provider_tee`, `text` is `<model id>:<sha256 of request>:<sha256 of response>` and the signer must match a verified model report; for `gateway` it is `<request hash>:<response hash>` and matches the gateway report. Streaming, aliases and the Responses API get `gateway` signatures, which don't prove model TEE execution.

Reference verifiers: https://github.com/nearai/nearai-cloud-verifier and https://github.com/near-examples/nearai-cloud-verification-example.

## From a board

Don't put the API key in firmware: anyone holding the board can read its flash and spend the user's credits. Keep the key on the Mac or a server and let the board call a small **relay** in the project (e.g. `relay.mjs`, run with `node --env-file=.env.local`) that adds the key, picks the model, caps `max_tokens`, and returns only the short answer the board needs. A relay is also where verification belongs: run the SDK there and pass the board a verified result. If the board must reach NEAR AI directly, the user should give it its own key and revoke it when the board is retired.

## Pricing

Per token, input and output priced separately per 1M tokens, rate set per model. No minimums or subscriptions; private execution and attestation are included in the rate. Approved businesses can be invoiced monthly; enterprise plans add reserved capacity. Read https://near.ai/pricing.md for current numbers.

## Read more

Search the bundled NEAR AI docs: `near_docs_search { "source": "nearai", "query": "attestation nonce" }`, then `near_docs_read`. Key pages:

- `nearai/cloud/quickstart.md`, `nearai/cloud/models.md`, `nearai/cloud/private-inference.md`
- `nearai/cloud/guides/openai-compatibility.md`, `stateless-responses.md`, `specialized-endpoints.md`, `prompt-caching.md`, `e2ee-chat-completions.md`
- `nearai/cloud/guides/integrations/model-discovery.md`, `nearai/cloud/reasoning-models.md`
- `nearai/cloud/verification/index.md`, `verification/cloud-api/gateway-attestation.md`, `model-attestations.md`, `response-signatures.md`
- `nearai/cloud/inference-sdk/javascript.md` (and `python.md`, `rust.md`, `go.md`)
- `nearai/cloud/staking-for-inference/overview.md`
- `nearai/api-reference/chat/create-chat-completion.md` and the rest of `nearai/api-reference/`

Related skills: `near-ironclaw` (agents on NEAR AI Cloud), `near-agent-market` (selling an agent's work), `near-devices`.
