> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# List available models

> Returns all AI models available for completions. OpenAI-compatible endpoint.



## OpenAPI

````yaml /api-reference/openapi.json get /v1/models
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
  /v1/models:
    get:
      tags:
        - Chat
      summary: List available models
      description: >-
        Returns all AI models available for completions. OpenAI-compatible
        endpoint.
      operationId: models
      responses:
        '200':
          description: List of available models
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModelsResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      security:
        - {}
components:
  schemas:
    ModelsResponse:
      type: object
      required:
        - object
        - data
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/ModelInfo'
        object:
          type: string
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    ModelInfo:
      type: object
      required:
        - id
        - object
        - created
        - owned_by
        - supported_sampling_parameters
        - supported_features
      properties:
        architecture:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/ModelArchitecture'
              description: >-
                Model architecture (input/output modalities), legacy nested
                camelCase shape.
        context_length:
          type:
            - integer
            - 'null'
          format: int32
          description: Context length in tokens.
        created:
          type: integer
          format: int64
        datacenters:
          type:
            - array
            - 'null'
          items:
            $ref: '#/components/schemas/Datacenter'
          description: |-
            Datacenters the model runs in (OpenRouter `datacenters`), e.g.
            `[{ "country_code": "US" }]`. Omitted when unset.
        deprecation_date:
          type:
            - string
            - 'null'
          description: >-
            OpenRouter `deprecation_date`: planned deprecation date as an ISO
            8601

            string. Omitted when there is no planned deprecation.
        description:
          type:
            - string
            - 'null'
          description: Human-readable description (OpenRouter `description`).
        hugging_face_id:
          type:
            - string
            - 'null'
          description: HuggingFace identifier (OpenRouter `hugging_face_id`).
        id:
          type: string
        input_modalities:
          type:
            - array
            - 'null'
          items:
            type: string
          description: >-
            OpenRouter `input_modalities`: flat snake_case duplicate of
            architecture.input.
        is_ready:
          type:
            - boolean
            - 'null'
          description: >-
            OpenRouter `is_ready`: `false` keeps the model hidden on
            OpenRouter's

            side, `true` enables auto-staging. Exposed verbatim; omitted when
            unset.
        max_output_length:
          type:
            - integer
            - 'null'
          format: int32
          description: Maximum output tokens (OpenRouter `max_output_length`).
        name:
          type:
            - string
            - 'null'
          description: Human-readable model name (OpenRouter `name`).
        object:
          type: string
        openrouter:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/OpenRouter'
              description: >-
                OpenRouter slug override: `{ "slug": "<value>" }`. Present only
                when an

                override is set (our `id` does not match OpenRouter's canonical
                slug).

                Omitted entirely when unset.
        output_modalities:
          type:
            - array
            - 'null'
          items:
            type: string
          description: >-
            OpenRouter `output_modalities`: flat snake_case duplicate of
            architecture.output.
        owned_by:
          type: string
        pricing:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/ModelPricing'
              description: Pricing information (HuggingFace + OpenRouter compatible).
        quantization:
          type:
            - string
            - 'null'
          description: |-
            Quantization label (OpenRouter `quantization`):
            int4/int8/fp4/fp6/fp8/fp16/bf16/fp32.
        successor_model_id:
          type:
            - string
            - 'null'
          description: |-
            Recommended replacement for a model with a planned deprecation
            (canonical model id). Omitted when none is set. The public catalogs
            name only a listed successor.
        supported_features:
          type: array
          items:
            type: string
          description: Feature capabilities (OpenRouter `supported_features`).
        supported_sampling_parameters:
          type: array
          items:
            type: string
          description: >-
            Sampling parameters accepted by the model (OpenRouter
            `supported_sampling_parameters`).
        textPricing:
          description: |-
            Exact, versioned USD-per-million text pricing. The legacy `pricing`
            projection remains Standard-short for compatibility.
        top_provider:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/TopProvider'
              description: 'OpenRouter `top_provider`: per-provider context/output limits.'
        upcoming_pricing:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/UpcomingModelPricingInfo'
              description: Earliest pending change and complete prices after it is applied.
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
    OpenRouter:
      type: object
      description: >-
        OpenRouter slug-override block.


        OpenRouter's provider spec

        (https://openrouter.ai/docs/guides/community/for-providers) requires the

        model `id` to EXACTLY match OpenRouter's canonical slug, OR for the
        provider

        to supply an explicit override via a nested `openrouter` object carrying
        the

        canonical slug. We emit this object only when an override is configured.
      required:
        - slug
      properties:
        slug:
          type: string
          description: >-
            OpenRouter's canonical slug for this model (lowercase
            `author/slug`).
    ModelPricing:
      type: object
      description: >-
        Model pricing information.


        `input` / `output` are the legacy HuggingFace-style fields (USD per
        million

        tokens, as floats). The remaining fields match OpenRouter's provider
        spec

        (USD per single token, serialized as strings to avoid float precision

        issues): https://openrouter.ai/docs/guides/community/for-providers
      required:
        - input
        - output
        - prompt
        - completion
        - image
        - request
      properties:
        completion:
          type: string
          description: 'OpenRouter: USD per output token, as a string.'
        image:
          type: string
          description: 'OpenRouter: USD per image, as a string ("0" when not applicable).'
        input:
          type: number
          format: double
          description: >-
            Price per million input tokens in USD (legacy field, kept for
            back-compat).
        input_cache_read:
          type:
            - string
            - 'null'
          description: >-
            OpenRouter: USD per cached input token, as a string. Omitted when
            cache-read

            pricing is disabled; `"0"` means cached input tokens are genuinely
            free.
        output:
          type: number
          format: double
          description: >-
            Price per million output tokens in USD (legacy field, kept for
            back-compat).
        prompt:
          type: string
          description: 'OpenRouter: USD per input token, as a string.'
        request:
          type: string
          description: 'OpenRouter: USD per request, as a string ("0" when not applicable).'
    TopProvider:
      type: object
      description: |-
        OpenRouter `top_provider` block: context length and max output tokens
        in the field names OpenRouter's `/api/v1/models` schema uses.
      required:
        - is_moderated
      properties:
        context_length:
          type:
            - integer
            - 'null'
          format: int32
          description: Context length in tokens (mirrors top-level `context_length`).
        is_moderated:
          type: boolean
          description: >-
            Whether the provider moderates content. We do not, so this is always
            false.
        max_completion_tokens:
          type:
            - integer
            - 'null'
          format: int32
          description: >-
            Maximum output tokens per response (mirrors top-level
            `max_output_length`).
    UpcomingModelPricingInfo:
      type: object
      description: >-
        A scheduled change on the OpenAI-compatible model catalog. Prices use
        the

        same representation as the model's current `pricing` and `textPricing`.
      required:
        - effective_at
        - pricing
      properties:
        effective_at:
          type: string
        pricing:
          $ref: '#/components/schemas/ModelPricing'
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