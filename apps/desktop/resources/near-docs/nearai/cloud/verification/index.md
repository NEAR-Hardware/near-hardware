> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Verification

> Verify requests sent through the NEAR AI Cloud Gateway.

Use these guides to verify the evidence returned for requests sent through the NEAR AI Cloud Gateway.

> [!TIP]
>
> See an example implementation in the [NEAR AI Cloud Verification Example](https://github.com/near-examples/nearai-cloud-verification-example) repo. A more complete verifier is available in the [NEAR AI Cloud Verifier](https://github.com/nearai/nearai-cloud-verifier) repo.

> [!NOTE]
>
> Using a direct completions endpoint (`{slug}.completions.near.ai`)? Direct verification is experimental. See [Direct Completions](https://docs.near.ai/cloud/experimental/direct-completions) for the current limitations.

## Verify in your browser

Use the [Verification Center](https://docs.near.ai/cloud/verification/verification-center.md) at [cloud.near.ai/verify](https://cloud.near.ai/verify) to inspect a model's hardware attestation and a reply's signature without writing code.

## Verification flow

Start with [Gateway attestation](https://docs.near.ai/cloud/verification/cloud-api/gateway-attestation.md) to verify fresh deployment evidence before a completion. When your policy requires NEAR model evidence, verify every returned [model-attestation candidate](https://docs.near.ai/cloud/verification/cloud-api/model-attestations.md). You can also verify the [TLS connection](https://docs.near.ai/cloud/verification/cloud-api/tls.md) and [image provenance](https://docs.near.ai/cloud/verification/cloud-api/image-provenance.md) as required by your policy; after a completion, verify its [response signature](https://docs.near.ai/cloud/verification/cloud-api/response-signatures.md) when present.

## Common verification concepts

> [card] [Quote, nonce, and signer bindings](https://docs.near.ai/cloud/verification/reference/quote-nonce-signer.md)
>
> Learn how fresh attestation evidence is tied to your request and to a signing identity.

> [card] [Verification policy](https://docs.near.ai/cloud/verification/reference/verification-policy.md)
>
> Decide which checks, measurements, and source-provenance requirements your application accepts.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.