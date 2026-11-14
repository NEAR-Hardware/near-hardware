> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create API key for workspace

> **Deprecated:** this endpoint is moving to cloud-platform at the same path; the cloud-platform base URL will be announced. Behaviour may differ in edge cases.

Creates a new API key for a workspace. Note: The key may take up to 10 seconds
to become active for authentication due to internal caching.



## OpenAPI

````yaml /api-reference/openapi.json post /v1/workspaces/{workspace_id}/api-keys
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
  /v1/workspaces/{workspace_id}/api-keys:
    post:
      tags:
        - Workspaces
      summary: Create API key for workspace
      description: >-
        **Deprecated:** this endpoint is moving to cloud-platform at the same
        path; the cloud-platform base URL will be announced. Behaviour may
        differ in edge cases.


        Creates a new API key for a workspace. Note: The key may take up to 10
        seconds

        to become active for authentication due to internal caching.
      operationId: create_workspace_api_key
      parameters:
        - name: workspace_id
          in: path
          description: Workspace ID
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateApiKeyRequest'
        required: true
      responses:
        '201':
          description: API key created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiKeyResponse'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '403':
          description: Forbidden
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Workspace not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      deprecated: true
      security:
        - session_token: []
components:
  schemas:
    CreateApiKeyRequest:
      type: object
      required:
        - name
      properties:
        expires_at:
          type:
            - string
            - 'null'
          format: date-time
        name:
          type: string
        spendLimit:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/DecimalPriceRequest'
    ApiKeyResponse:
      type: object
      description: API Key response model
      required:
        - id
        - key_prefix
        - workspace_id
        - created_by_user_id
        - created_at
        - is_active
      properties:
        created_at:
          type: string
          format: date-time
        created_by_user_id:
          type: string
        deleted_at:
          type:
            - string
            - 'null'
          format: date-time
        expires_at:
          type:
            - string
            - 'null'
          format: date-time
        id:
          type: string
        is_active:
          type: boolean
        key:
          type:
            - string
            - 'null'
        key_prefix:
          type: string
        last_used_at:
          type:
            - string
            - 'null'
          format: date-time
        name:
          type:
            - string
            - 'null'
        spend_limit:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/DecimalPrice'
        usage:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/DecimalPrice'
        workspace_id:
          type: string
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    DecimalPriceRequest:
      type: object
      description: >-
        Decimal price for API requests


        The system internally uses a fixed scale of 9 (nano-dollars = 1
        billionth of a dollar).

        Clients must provide amounts in nano-dollars.


        Examples:
          $100.00 USD: amount=100000000000, currency="USD"
          $1.00 USD: amount=1000000000, currency="USD"
          $0.01 USD: amount=10000000, currency="USD"
      required:
        - amount
        - currency
      properties:
        amount:
          type: integer
          format: int64
          description: >-
            Amount in nano-dollars (scale 9). For example, $1.00 = 1000000000
            nano-dollars.
        currency:
          type: string
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