> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get organization usage broken down by model.

> **Deprecated:** this endpoint is moving to cloud-platform at the same path; the cloud-platform base URL will be announced. Behaviour may differ in edge cases.

Returns one row per model, summed over a rolling window ending now:
`day` = last 24h, `week` = last 7 days, `month` = last 30 days (NOT calendar
day/week/month-to-date). Setting `start` or `end` (or `period=custom`) sums a custom
range instead; a range longer than 366 days is rejected with 400. Used by the
dashboard pie chart to show which models drive spend.



## OpenAPI

````yaml /api-reference/openapi.json get /v1/organizations/{org_id}/usage/by-model
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
  /v1/organizations/{org_id}/usage/by-model:
    get:
      tags:
        - Usage
      summary: Get organization usage broken down by model.
      description: >-
        **Deprecated:** this endpoint is moving to cloud-platform at the same
        path; the cloud-platform base URL will be announced. Behaviour may
        differ in edge cases.


        Returns one row per model, summed over a rolling window ending now:

        `day` = last 24h, `week` = last 7 days, `month` = last 30 days (NOT
        calendar

        day/week/month-to-date). Setting `start` or `end` (or `period=custom`)
        sums a custom

        range instead; a range longer than 366 days is rejected with 400. Used
        by the

        dashboard pie chart to show which models drive spend.
      operationId: get_organization_usage_by_model
      parameters:
        - name: org_id
          in: path
          description: Organization ID
          required: true
          schema:
            type: string
        - name: period
          in: query
          description: >-
            Rolling window: `day` (last 24h), `week` (last 7d), or `month` (last
            30d); or `custom` for the `start`/`end` range. Default: `month`.
            Setting `start` or `end` selects the custom range whatever `period`
            says
          required: false
          schema:
            type: string
        - name: start
          in: query
          description: Custom range start (ISO 8601). Defaults to `end` minus 30 days
          required: false
          schema:
            type: string
        - name: end
          in: query
          description: Custom range end, exclusive (ISO 8601). Defaults to now
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Per-model usage breakdown
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UsageByModelResponse'
        '400':
          description: Invalid date or date range
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
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '504':
          description: Usage query timed out
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      deprecated: true
      security:
        - session_token: []
components:
  schemas:
    UsageByModelResponse:
      type: object
      description: Per-model usage breakdown response
      required:
        - period
        - start_date
        - data
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/UsageByModelEntryResponse'
        end_date:
          type:
            - string
            - 'null'
          description: >-
            Exclusive end of a custom range. Absent for rolling windows, which
            end now.
        period:
          type: string
          description: >-
            `day`, `week` or `month` for a rolling window; `custom` for a
            `start`/`end` range.
        start_date:
          type: string
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    UsageByModelEntryResponse:
      type: object
      description: Per-model usage aggregation entry
      required:
        - model
        - input_tokens
        - output_tokens
        - total_tokens
        - total_cost
        - total_cost_display
        - request_count
      properties:
        input_tokens:
          type: integer
          format: int64
        model:
          type: string
        output_tokens:
          type: integer
          format: int64
        request_count:
          type: integer
          format: int64
        total_cost:
          type: integer
          format: int64
        total_cost_display:
          type: string
        total_tokens:
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