> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Intel Trust Authority attestation token

> Get Intel Trust Authority signed attestation JWTs for the gateway and, when
requested, compatible model provider evidence. Public endpoint — this is an
explicit, documented decision (nearai/infra#193): the response carries only
ITA-signed TEE evidence (no customer or key-scoped data), public access lets
third parties verify the platform without an account, and upstream ITA rate
limits bound abuse (propagated as 429). See
`build_public_attestation_routes` in `routes/attestation.rs`.



## OpenAPI

````yaml /api-reference/openapi.json get /v1/attestation/ita-token
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
  /v1/attestation/ita-token:
    get:
      tags:
        - Attestation
      summary: Get Intel Trust Authority attestation token
      description: >-
        Get Intel Trust Authority signed attestation JWTs for the gateway and,
        when

        requested, compatible model provider evidence. Public endpoint — this is
        an

        explicit, documented decision (nearai/infra#193): the response carries
        only

        ITA-signed TEE evidence (no customer or key-scoped data), public access
        lets

        third parties verify the platform without an account, and upstream ITA
        rate

        limits bound abuse (propagated as 429). See

        `build_public_attestation_routes` in `routes/attestation.rs`.
      operationId: get_ita_token
      parameters:
        - name: model
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
        - name: signing_algo
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
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: policy_ids
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: policy_must_match
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
        - name: token_signing_alg
          in: query
          required: false
          schema:
            type:
              - string
              - 'null'
      responses:
        '200':
          description: ITA attestation token retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ItaTokenResponse'
        '400':
          description: Invalid parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: ITA rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '502':
          description: Bad ITA upstream response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '503':
          description: ITA attestation unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '504':
          description: ITA request timed out
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      security:
        - {}
components:
  schemas:
    ItaTokenResponse:
      type: object
      required:
        - gateway
        - models
        - jwks_url
        - policy_ids
        - policy_must_match
        - nonce
      properties:
        gateway:
          $ref: '#/components/schemas/ItaTokenItem'
        jwks_url:
          type: string
        model_alias_resolved:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/ItaModelAliasResolved'
        models:
          type: array
          items:
            $ref: '#/components/schemas/ItaModelTokenItem'
        nonce:
          type: string
        policy_ids:
          type: array
          items:
            type: string
        policy_must_match:
          type: boolean
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    ItaTokenItem:
      type: object
      required:
        - token
        - token_type
        - attestation_type
        - token_signing_alg
      properties:
        attestation_type:
          type: string
        ita_request_id:
          type:
            - string
            - 'null'
        token:
          type: string
        token_signing_alg:
          type: string
        token_type:
          type: string
    ItaModelAliasResolved:
      type: object
      required:
        - requested
        - canonical
      properties:
        canonical:
          type: string
        requested:
          type: string
    ItaModelTokenItem:
      type: object
      required:
        - model
        - token
        - token_type
        - attestation_type
        - token_signing_alg
      properties:
        attestation_type:
          type: string
        ita_request_id:
          type:
            - string
            - 'null'
        model:
          type: string
        token:
          type: string
        token_signing_alg:
          type: string
        token_type:
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