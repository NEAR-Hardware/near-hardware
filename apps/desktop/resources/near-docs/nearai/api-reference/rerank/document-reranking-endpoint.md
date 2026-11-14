> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Document reranking endpoint

> Ranks documents by relevance to a query using a reranker model.

**Concurrent Request Limits:** Each organization has a per-model concurrent request limit (default: 64).
When the limit is reached, new requests will fail with 429 status code. Wait for in-flight requests to complete before retrying.



## OpenAPI

````yaml /api-reference/openapi.json post /v1/rerank
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
  /v1/rerank:
    post:
      tags:
        - Rerank
      summary: Document reranking endpoint
      description: >-
        Ranks documents by relevance to a query using a reranker model.


        **Concurrent Request Limits:** Each organization has a per-model
        concurrent request limit (default: 64).

        When the limit is reached, new requests will fail with 429 status code.
        Wait for in-flight requests to complete before retrying.
      operationId: rerank
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RerankRequest'
        required: true
      responses:
        '200':
          description: Successful rerank
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RerankResponse'
        '400':
          description: Invalid request (empty documents, invalid model, etc.)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized (missing or invalid API key)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Model not found
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
          description: Server error (billing failure, provider error)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      security:
        - api_key: []
components:
  schemas:
    RerankRequest:
      type: object
      description: Request for document reranking
      required:
        - model
        - query
        - documents
      properties:
        documents:
          type: array
          items:
            type: string
          description: Documents to rerank
        model:
          type: string
          description: Model ID to use for reranking
        query:
          type: string
          description: Query to rerank documents against
        return_documents:
          type:
            - boolean
            - 'null'
          description: Whether to include document text in each result. Defaults to true.
        top_n:
          type:
            - integer
            - 'null'
          description: Maximum number of ranked results to return
          minimum: 0
    RerankResponse:
      type: object
      description: Response from document reranking
      required:
        - id
        - model
        - results
      properties:
        id:
          type: string
          description: Unique identifier for the rerank request
        model:
          type: string
          description: Model used for reranking
        results:
          type: array
          items:
            $ref: '#/components/schemas/RerankResult'
          description: Reranked results
        usage:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/RerankUsage'
              description: Usage information (optional)
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    RerankResult:
      type: object
      description: Individual reranked result
      required:
        - index
        - relevance_score
      properties:
        document:
          description: The document (can be string or object depending on provider)
        index:
          type: integer
          format: int32
          description: Index of the document in the original input
        relevance_score:
          $ref: '#/components/schemas/RerankScore'
          description: Relevance score (typically 0.0 to 1.0), or E2EE ciphertext.
    RerankUsage:
      type: object
      description: Usage information for rerank request
      properties:
        prompt_tokens:
          type:
            - integer
            - 'null'
          format: int32
          description: Input tokens
        total_tokens:
          type:
            - integer
            - 'null'
          format: int32
          description: Total number of tokens used
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
    RerankScore:
      oneOf:
        - type: number
          format: double
        - type: string
      description: A numeric rerank score or its E2EE ciphertext.
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