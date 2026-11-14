> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get attestation report

> Get hardware attestation report for TEE verification. The API key is
optional, so a client can verify the gateway before it sends any
credential. Without a key, listed models only; with one, also the unlisted
models the key's organization may use. A key that is sent must be valid.
Report retrieval is non-billable — no usage or billing records are created.

With `model=...&provider=chutes`, the Chutes entry in `model_attestations` includes
`quote_b64`, `certificate_b64`, `e2e_pubkey`, `nonce`, and `gpu_evidence` for
the selected verified instance. `gpu_evidence` preserves every GPU's `arch`,
`certificate` (base64 device certificate chain), and `evidence` (base64 SPDM
evidence) from the same evidence request as the CPU quote and certificate.
`gpu_verdict` remains available as verification metadata.

The GPU challenge is `SHA256(UTF8(nonce + e2e_pubkey))`, using the returned
nonce's hex text and public key's base64 text without decoding either input.
Pass the hex-encoded digest as the NVIDIA verification nonce; it is also bound
into the CPU quote's `report_data[0:32]`. The raw client nonce is not the GPU
challenge.



## OpenAPI

````yaml /api-reference/openapi.json get /v1/attestation/report
openapi: 3.1.0
info:
  title: NEAR AI Cloud API
  description: >-
    NEAR AI Cloud API for private AI model inference and organization
    administration.
  contact:
    name: NEAR AI Team
    email: support@near.ai
  license:
    name: MIT
  version: 1.0.0
servers:
  - url: https://cloud-api.near.ai
    description: NEAR AI Cloud
security:
  - session_token: []
  - api_key: []
tags:
  - name: Chat
    description: Chat completion endpoints for AI model inference
  - name: Images
    description: Image generation endpoints
  - name: Decisions
    description: Typed decisions through the System One protocol
  - name: Audio
    description: Audio transcription endpoints
  - name: Rerank
    description: Document reranking endpoints
  - name: Score
    description: Text similarity scoring endpoints
  - name: Privacy
    description: Privacy classification (PII span detection) endpoints
  - name: Models
    description: Public model catalog and information
  - name: Conversations
    description: >-
      Temporary authenticated, workspace-scoped migration access for export and
      account deletion. Only `POST /v1/conversations/batch`, `GET
      /v1/conversations/{conversation_id}`, `GET
      /v1/conversations/{conversation_id}/items`, and `DELETE
      /v1/conversations/{conversation_id}` are available. Conversation creation
      and every other mutation return `410 Gone`; this surface will be removed
      after data migration. Migration responses use `Cache-Control: no-store`.
  - name: Files
    description: >-
      Temporary authenticated, workspace-scoped migration access for export and
      account deletion. Only `GET /v1/files`, `GET /v1/files/{file_id}`, `GET
      /v1/files/{file_id}/content`, and `DELETE /v1/files/{file_id}` are
      available. Upload and every other mutation return `410 Gone`; this surface
      will be removed after data migration. Migration responses use
      `Cache-Control: no-store`.
  - name: Responses
    description: >-
      Stateless response inference. Both paths normalize omitted or null `store`
      to `false` and reject `store: true`. Raw request/response content,
      response items, and history are not persisted. Clients must include any
      prior context in each request. Canonical `openai/` models use one upstream
      native Responses request after alias resolution. Other models use the
      typed adapter, with bounded request-scoped inference rounds when hosted
      search is requested.


      Both paths accept client-managed `function` and `custom` tools, including
      tools grouped in a `namespace`, and leading developer `additional_tools`
      declarations. Cloud returns calls without executing them; clients replay
      each `function_call` or `custom_tool_call` with its matching output and
      caller-managed history. Preserve `call_id`, names, namespaces, raw
      arguments or custom input, and provider metadata such as
      `thought_signature`. The typed replay path accepts assistant `output_text`
      parts and plaintext `reasoning` items, using reasoning content or its
      summary as prior assistant context. Encrypted-only reasoning requires a
      native Responses backend. The typed adapter supports text custom tools and
      the Codex `exec` Lark source grammar; other grammars require a native
      backend.


      Each generated item has its own `output_index`. Tool calls finish with
      `response.output_item.done`; a successful model turn ends with
      `response.completed`, including when tools await client execution.
      Reasoning uses `response.reasoning_text.delta`; failures expose
      `response.error` in `response.failed` and preserve partial usage.


      The typed adapter executes `web_search` and `web_context_search` using a
      bounded request-scoped loop, emits search lifecycle events and URL
      citations, and accumulates usage across inference rounds without storing
      history. Optional `web_search.count` (0–20) overrides model-selected
      counts; 0 skips the search provider. If a model emits client tool calls
      and searches in the same round, client calls are returned without
      executing that round's searches. On the typed path, completed search
      output markers may accompany replayed assistant text, but raw search
      results are not restored across requests. Native Responses also accepts
      top-level `web_search`, executed by the upstream provider without a Cloud
      search loop. Complete native `web_search_call` replay items, search
      configuration, and `include` are forwarded unchanged; provider-returned
      search citations and sources retain their native shape. `file_search`,
      `code_interpreter`, `computer`, and remote `mcp` are unsupported.
      Image-generation/editing models are rejected on both paths. The separate
      `POST /mcp` endpoint exposes its `web_search` tool independently of
      Responses; use `/v1/images/*` for image generation/editing. Existing
      completed-response gateway attestation is preserved best-effort: when the
      signature write succeeds, `GET /v1/signature/resp_*` retrieves signatures
      over SHA-256 request/response digests, never raw content. Interrupted
      streams create no `resp_*` attestation record or legacy disconnect
      fallback. Responses rejects conversation linkage, response history, and
      file input; the separate Conversation and File endpoints are not part of
      Responses inference.
  - name: Organizations
    description: Organization management
  - name: Organization Members
    description: Organization member and invitation management
  - name: Workspaces
    description: Workspace and API key management
  - name: Users
    description: User profile and token management
  - name: Invitations
    description: Token-based invitation handling
  - name: Usage
    description: Usage tracking and billing information
  - name: Reporting
    description: Read-only customer usage reporting
  - name: Billing
    description: Billing costs endpoint (HuggingFace integration)
  - name: Staking Farm
    description: House of Stake farm credit configuration and synchronization
  - name: Health
    description: Health check endpoints
  - name: Attestation
    description: Attestation and verification endpoints
  - name: Gateway
    description: Model gateway integration endpoints
  - name: Admin
    description: Administrative endpoints (admin access required)
  - name: Services
    description: Public platform services (e.g. web_search pricing)
paths:
  /v1/attestation/report:
    get:
      tags:
        - Attestation
      summary: Get attestation report
      description: >-
        Get hardware attestation report for TEE verification. The API key is

        optional, so a client can verify the gateway before it sends any

        credential. Without a key, listed models only; with one, also the
        unlisted

        models the key's organization may use. A key that is sent must be valid.

        Report retrieval is non-billable — no usage or billing records are
        created.


        With `model=...&provider=chutes`, the Chutes entry in
        `model_attestations` includes

        `quote_b64`, `certificate_b64`, `e2e_pubkey`, `nonce`, and
        `gpu_evidence` for

        the selected verified instance. `gpu_evidence` preserves every GPU's
        `arch`,

        `certificate` (base64 device certificate chain), and `evidence` (base64
        SPDM

        evidence) from the same evidence request as the CPU quote and
        certificate.

        `gpu_verdict` remains available as verification metadata.


        The GPU challenge is `SHA256(UTF8(nonce + e2e_pubkey))`, using the
        returned

        nonce's hex text and public key's base64 text without decoding either
        input.

        Pass the hex-encoded digest as the NVIDIA verification nonce; it is also
        bound

        into the CPU quote's `report_data[0:32]`. The raw client nonce is not
        the GPU

        challenge.
      operationId: get_attestation_report
      parameters:
        - name: model
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: signing_algo
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: nonce
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: signing_address
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: include_tls_fingerprint
          in: query
          description: >-
            Include the TLS certificate SPKI fingerprint in the report-data
            binding.

            Defaults to false; when true, report_data[..32] =
            SHA256(signing_address || tls_cert_fingerprint).
          required: false
          schema:
            type:
              - boolean
              - 'null'
        - name: provider
          in: query
          description: >-
            Restrict the report to a specific provider.

            Accepted values: `near` (NEAR AI's own TEE fleet), `chutes`, or
            `tinfoil` (attested third-party sources).

            When omitted, the first successfully responding provider is used.
          required: false
          schema:
            type:
              - string
              - 'null'
      responses:
        '200':
          description: Attestation report retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AttestationResponse'
        '400':
          description: >-
            Invalid nonce, signing_algo or provider, or unknown model (a model
            the caller may not use is reported as unknown)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: An API key was sent and is invalid
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: >-
            Too many anonymous requests in progress; retry after `Retry-After`
            seconds or send an API key
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '503':
          description: Service unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      security:
        - {}
        - api_key: []
components:
  schemas:
    AttestationResponse:
      type: object
      required:
        - gateway_attestation
      properties:
        gateway_attestation:
          $ref: '#/components/schemas/DstackCpuQuote'
        model_attestations:
          type: array
          items:
            type: object
            additionalProperties: {}
            propertyNames:
              type: string
        ohttp_attestation:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/OhttpAttestation'
              description: >-
                OHTTP key attestation payload. Includes an Ed25519 signature
                over the decoded

                `key_config` bytes so clients can verify the HPKE key is bound
                to the TEE.
        ohttp_key_config:
          type:
            - string
            - 'null'
          description: >-
            Hex-encoded OHTTP key configuration (RFC 9458). Present only when
            OHTTP_ENABLED=true.

            Legacy flat field; mirrors `ohttp_attestation.key_config` when
            present.
        tls_certificate:
          type:
            - string
            - 'null'
          description: >-
            PEM-encoded TLS certificate read from `TLS_CERT_PATH` when
            `include_tls_fingerprint=true`.

            `report_data` binds `tls_cert_fingerprint` (the SHA-256 hash of the
            TLS SPKI) together with

            `signing_address`, not the PEM bytes.
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    DstackCpuQuote:
      type: object
      description: Response for attestation report endpoint
      required:
        - signing_address
        - signing_algo
        - intel_quote
        - event_log
        - report_data
        - request_nonce
        - info
      properties:
        event_log:
          type: string
          description: The event log associated with the quote
        info:
          description: Application info from Dstack
        intel_quote:
          type: string
          description: The attestation quote in hexadecimal format
        report_data:
          type: string
          description: >-
            Value bound into the quote. Its final 32 bytes contain the request
            nonce.

            With `include_tls_fingerprint=true`, its first 32 bytes are

            SHA-256(signing_address || tls_cert_fingerprint).
        request_nonce:
          type: string
          description: The nonce used in the attestation request
        signing_address:
          type: string
          description: The signing address used for the attestation
        signing_algo:
          type: string
          description: The signing algorithm used for the attestation (ecdsa or ed25519)
        tls_cert_fingerprint:
          type:
            - string
            - 'null'
          description: >-
            SHA-256 hash of the TLS certificate's SPKI, if requested via
            include_tls_fingerprint.
        vpc:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/VpcInfo'
              description: VPC information (optional)
    OhttpAttestation:
      type: object
      description: >-
        OHTTP attestation payload included in `GET /v1/attestation/report`.


        Clients verify `signature` (Ed25519 over decoded `key_config` bytes)
        against

        the attested `signing_key` to confirm the OHTTP public key is bound to
        the TEE.
      required:
        - signing_algo
        - signing_key
        - key_config
        - signature
      properties:
        key_config:
          type: string
          description: Hex-encoded OHTTP key configuration bytes (RFC 9458).
        signature:
          type: string
          description: Ed25519 signature over the decoded `key_config` bytes.
        signing_algo:
          type: string
        signing_key:
          type: string
    ErrorDetail:
      type: object
      required:
        - message
        - type
      properties:
        code:
          type:
            - string
            - 'null'
        message:
          type: string
        param:
          type:
            - string
            - 'null'
        type:
          type: string
    VpcInfo:
      type: object
      description: VPC information in attestation
      properties:
        vpc_hostname:
          type:
            - string
            - 'null'
          description: VPC hostname of this node
        vpc_server_app_id:
          type:
            - string
            - 'null'
          description: VPC server app ID
  securitySchemes:
    session_token:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: >-
        JWT access token for user authentication (Authorization: Bearer
        <jwt_token>). Create via POST /users/me/access_tokens.
    api_key:
      type: http
      scheme: bearer
      bearerFormat: api_key
      description: 'API key for programmatic access (Authorization: Bearer sk-<api_key>)'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.