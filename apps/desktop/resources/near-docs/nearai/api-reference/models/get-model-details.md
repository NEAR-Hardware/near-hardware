> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get model details

> Get pricing and metadata for a specific model. URL-encode model names containing slashes. Public endpoint.



## OpenAPI

````yaml /api-reference/openapi.json get /v1/model/{model_name}
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
  /v1/model/{model_name}:
    get:
      tags:
        - Models
      summary: Get model details
      description: >-
        Get pricing and metadata for a specific model. URL-encode model names
        containing slashes. Public endpoint.
      operationId: get_model_by_name
      parameters:
        - name: model_name
          in: path
          description: Model name (URL-encode if it contains slashes)
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Model details with pricing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModelWithPricing'
        '404':
          description: Model not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    ModelWithPricing:
      type: object
      description: Model with pricing information
      required:
        - modelId
        - inputCostPerToken
        - outputCostPerToken
        - costPerImage
        - metadata
      properties:
        cacheReadCostPerToken:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/DecimalPrice'
              description: >-
                Cost per cached input token. Omitted when cache pricing is
                disabled;

                an amount of 0 means cached tokens are genuinely free.
        costPerImage:
          $ref: '#/components/schemas/DecimalPrice'
        inputCostPerToken:
          $ref: '#/components/schemas/DecimalPrice'
        metadata:
          $ref: '#/components/schemas/ModelMetadata'
        modelId:
          type: string
        outputCostPerToken:
          $ref: '#/components/schemas/DecimalPrice'
        textPricing: {}
        upcomingPricing:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/UpcomingPricing'
              description: Complete future prices and date for the earliest pending change.
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    DecimalPrice:
      type: object
      description: >-
        Decimal price for API responses


        The system uses a fixed scale of 9 (nano-dollars = 1 billionth of a
        dollar).

        The scale field is included in responses for client convenience.
      required:
        - amount
        - scale
        - currency
      properties:
        amount:
          type: integer
          format: int64
        currency:
          type: string
        scale:
          type: integer
          format: int64
    ModelMetadata:
      type: object
      description: Model metadata
      required:
        - verifiable
        - contextLength
        - modelDisplayName
        - modelDescription
        - ownedBy
        - providerType
        - attestationSupported
      properties:
        aliases:
          type: array
          items:
            type: string
        architecture:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/ModelArchitecture'
              description: Model architecture (input/output modalities)
        attestationSupported:
          type: boolean
          description: Whether this model supports TEE attestation
        contextLength:
          type: integer
          format: int32
        datacenters:
          type:
            - array
            - 'null'
          items:
            $ref: '#/components/schemas/Datacenter'
          description: |-
            Datacenters the model runs in (OpenRouter `datacenters`), e.g.
            `[{ "country_code": "US" }]`. Omitted when unset.
        deprecationDate:
          type:
            - string
            - 'null'
          description: >-
            OpenRouter `deprecation_date`: planned deprecation date as an ISO
            8601

            string. Omitted when there is no planned deprecation.
        huggingFaceId:
          type:
            - string
            - 'null'
          description: HuggingFace identifier (OpenRouter `hugging_face_id`).
        inferenceUrl:
          type:
            - string
            - 'null'
          description: Base URL for the model's inference endpoint
        isListed:
          type:
            - boolean
            - 'null'
          description: >-
            Whether the model is listed. An unlisted model is left out of the

            public model catalogs and only organizations that hold a grant may

            use it. Set on admin views only; the public catalog endpoints omit
            it.
        isReady:
          type:
            - boolean
            - 'null'
          description: 'OpenRouter `is_ready`: stored/exposed verbatim. Omitted when unset.'
        maxOutputLength:
          type:
            - integer
            - 'null'
          format: int32
          description: Maximum output tokens per response (OpenRouter `max_output_length`).
        modelDescription:
          type: string
        modelDisplayName:
          type: string
        modelIcon:
          type:
            - string
            - 'null'
        openrouterSlug:
          type:
            - string
            - 'null'
          description: >-
            OpenRouter `openrouter.slug` override (lowercase `author/slug`).
            Omitted

            when unset. On public `GET /v1/models` this surfaces as the nested

            `openrouter: { slug }` object; the admin view exposes the raw value.
        ownedBy:
          type: string
        providerConfig:
          description: JSON config for external providers (backend, base_url, etc.)
        providerType:
          type: string
          description: 'Provider type: "vllm" (TEE-enabled) or "external" (3rd party)'
        quantization:
          type:
            - string
            - 'null'
          description: Quantization label (int4/int8/fp4/fp6/fp8/fp16/bf16/fp32).
        successorModelId:
          type:
            - string
            - 'null'
          description: |-
            Recommended replacement for a model with a planned deprecation
            (canonical model id). Omitted when none is set. The public catalogs
            name only a listed successor.
        supportedFeatures:
          type: array
          items:
            type: string
          description: Feature capabilities (OpenRouter `supported_features`).
        supportedSamplingParameters:
          type: array
          items:
            type: string
          description: >-
            Sampling parameters accepted by the model (OpenRouter
            `supported_sampling_parameters`).
        verifiable:
          type: boolean
    UpcomingPricing:
      type: object
      description: |-
        A scheduled change on the native model catalog, in nano-dollars like the
        current prices. Absent when no change is pending.
      required:
        - effectiveAt
        - pricing
      properties:
        effectiveAt:
          type: string
        pricing:
          $ref: '#/components/schemas/PricingFields'
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
    ModelArchitecture:
      type: object
      description: Model architecture describing input/output modalities
      required:
        - inputModalities
        - outputModalities
      properties:
        inputModalities:
          type: array
          items:
            type: string
          description: >-
            Input modalities the model accepts, e.g., ["text"], ["text",
            "image"]
        outputModalities:
          type: array
          items:
            type: string
          description: Output modalities the model produces, e.g., ["text"], ["image"]
    Datacenter:
      type: object
      description: |-
        OpenRouter `datacenters` entry: a single datacenter the model runs in.

        The provider spec
        (https://openrouter.ai/docs/guides/community/for-providers) models
        `datacenters` as an array of objects, each with an ISO 3166 Alpha-2
        `country_code`. We store only the country codes (a `TEXT[]`) and
        reconstruct this object wrapper at serialization time.
      required:
        - country_code
      properties:
        country_code:
          type: string
          description: ISO 3166 Alpha-2 country code (e.g. "US"), uppercase.
    PricingFields:
      type: object
      description: |-
        Full pricing snapshot. `cacheReadCostPerToken` is omitted when cache
        pricing was disabled at snapshot time.
      required:
        - inputCostPerToken
        - outputCostPerToken
        - costPerImage
      properties:
        cacheReadCostPerToken:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/DecimalPrice'
        costPerImage:
          $ref: '#/components/schemas/DecimalPrice'
        inputCostPerToken:
          $ref: '#/components/schemas/DecimalPrice'
        outputCostPerToken:
          $ref: '#/components/schemas/DecimalPrice'
        textPricing: {}
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