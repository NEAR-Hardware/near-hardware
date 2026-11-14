> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create text completion

> Generate AI model responses for text prompts. OpenAI-compatible endpoint.



## OpenAPI

````yaml /api-reference/openapi.json post /v1/completions
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
  /v1/completions:
    post:
      tags:
        - Chat
      summary: Create text completion
      description: >-
        Generate AI model responses for text prompts. OpenAI-compatible
        endpoint.
      operationId: completions
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CompletionRequest'
        required: true
      responses:
        '200':
          description: Completion generated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompletionResponse'
        '400':
          description: Invalid request parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Invalid or missing API key
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: >-
            Rate limited or overloaded — retry with backoff. Check error.type:
            rate_limit_exceeded or service_overloaded.
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
      security:
        - api_key: []
components:
  schemas:
    CompletionRequest:
      type: object
      required:
        - model
        - prompt
      properties:
        best_of:
          type:
            - integer
            - 'null'
          format: int64
        echo:
          type:
            - boolean
            - 'null'
        frequency_penalty:
          type:
            - number
            - 'null'
          format: float
        logprobs:
          type:
            - integer
            - 'null'
          format: int64
        max_tokens:
          type:
            - integer
            - 'null'
          format: int64
        model:
          type: string
        'n':
          type:
            - integer
            - 'null'
          format: int64
        presence_penalty:
          type:
            - number
            - 'null'
          format: float
        prompt:
          $ref: '#/components/schemas/CompletionPrompt'
        stop:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/StopSequences'
        stream:
          type:
            - boolean
            - 'null'
        temperature:
          type:
            - number
            - 'null'
          format: float
        top_p:
          type:
            - number
            - 'null'
          format: float
      additionalProperties: {}
    CompletionResponse:
      type: object
      required:
        - id
        - object
        - created
        - model
        - choices
        - usage
      properties:
        choices:
          type: array
          items:
            $ref: '#/components/schemas/CompletionChoice'
        created:
          type: integer
          format: int64
        id:
          type: string
        model:
          type: string
        object:
          type: string
        usage:
          $ref: '#/components/schemas/CompletionUsage'
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    CompletionPrompt:
      oneOf:
        - type: string
        - type: array
          items:
            type: string
        - type: array
          items:
            type: integer
            format: int64
        - type: array
          items:
            type: array
            items:
              type: integer
              format: int64
      description: >-
        OpenAI `/v1/completions` `prompt`: a single string, a batch of strings,
        or

        token-ID array(s). This endpoint serves only the single-string form; the

        other shapes still deserialize (so the handler can return a clean 400
        rather

        than a framework deserialization error) and are rejected there.
    StopSequences:
      oneOf:
        - type: string
        - type: array
          items:
            type: string
      description: 'OpenAI `stop`: either a single string or an array of strings.'
    CompletionChoice:
      type: object
      required:
        - index
        - text
      properties:
        finish_reason:
          type:
            - string
            - 'null'
        index:
          type: integer
          format: int64
        logprobs: {}
        text:
          type: string
    CompletionUsage:
      type: object
      description: >-
        Usage for chat/completions endpoints.

        Serializes as prompt_tokens, prompt_tokens_details, completion_tokens,
        completion_tokens_details, total_tokens, reasoning_tokens.
      required:
        - prompt_tokens
        - completion_tokens
        - total_tokens
      properties:
        completion_tokens:
          type: integer
          format: int32
        completion_tokens_details:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/CompletionTokensDetails'
              description: |-
                Breakdown of `completion_tokens`. `reasoning_tokens` here is the
                standard location of the reasoning count, present when the model
                reported one.
        prompt_tokens:
          type: integer
          format: int32
        prompt_tokens_details:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/InputTokensDetails'
        reasoning_tokens:
          type:
            - integer
            - 'null'
          format: int64
          description: >-
            Deprecated: use `completion_tokens_details.reasoning_tokens`.
            Top-level

            reasoning count as reported by some self-hosted engines; kept for

            existing readers.
          deprecated: true
        total_tokens:
          type: integer
          format: int32
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
    CompletionTokensDetails:
      type: object
      description: >-
        Breakdown of chat-completion `completion_tokens`. Every field is
        optional:

        a provider may report any subset of them.
      properties:
        accepted_prediction_tokens:
          type:
            - integer
            - 'null'
          format: int64
        audio_tokens:
          type:
            - integer
            - 'null'
          format: int64
        reasoning_tokens:
          type:
            - integer
            - 'null'
          format: int64
          description: Tokens spent on reasoning.
        rejected_prediction_tokens:
          type:
            - integer
            - 'null'
          format: int64
    InputTokensDetails:
      type: object
      required:
        - cached_tokens
      properties:
        cached_tokens:
          type: integer
          format: int64
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