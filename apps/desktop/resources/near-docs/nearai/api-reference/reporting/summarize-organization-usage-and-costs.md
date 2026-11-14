> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Summarize organization usage and costs.

> **Deprecated:** this endpoint is moving to cloud-platform at the same path; the cloud-platform base URL will be announced. Behaviour may differ in edge cases.

Requires a reporting token scoped to the organization in the path. Totals
include inference and platform service usage by default.



## OpenAPI

````yaml /api-reference/openapi.json get /v1/organizations/{org_id}/usage/summary
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
  /v1/organizations/{org_id}/usage/summary:
    get:
      tags:
        - Reporting
      summary: Summarize organization usage and costs.
      description: >-
        **Deprecated:** this endpoint is moving to cloud-platform at the same
        path; the cloud-platform base URL will be announced. Behaviour may
        differ in edge cases.


        Requires a reporting token scoped to the organization in the path.
        Totals

        include inference and platform service usage by default.
      operationId: summary_usage
      parameters:
        - name: org_id
          in: path
          description: Organization ID
          required: true
          schema:
            type: string
            format: uuid
        - name: start_time
          in: query
          description: >-
            Inclusive RFC3339 start timestamp. Defaults to 366 days before the
            effective end_time.
          required: false
          schema:
            type: string
        - name: end_time
          in: query
          description: >-
            Inclusive RFC3339 end timestamp. Defaults to the request time. The
            effective range must not exceed 366 days.
          required: false
          schema:
            type: string
        - name: source
          in: query
          description: Usage source to summarize. Defaults to all.
          required: false
          schema:
            $ref: '#/components/schemas/ReportingUsageSource'
        - name: workspace_id
          in: query
          description: Filter by workspace ID.
          required: false
          schema:
            type: string
            format: uuid
        - name: api_key_id
          in: query
          description: Filter by API key ID.
          required: false
          schema:
            type: string
            format: uuid
        - name: model
          in: query
          description: Filter inference usage by model name.
          required: false
          schema:
            type: string
        - name: inference_type
          in: query
          description: Filter inference usage by inference type.
          required: false
          schema:
            type: string
        - name: service_name
          in: query
          description: Filter service usage by platform service name.
          required: false
          schema:
            type: string
        - name: credit_type
          in: query
          description: >-
            Filter costs by their saved grant, postpay, staking_farm, or payment
            allocation.
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Usage summary
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReportingUsageSummaryResponse'
        '400':
          description: Invalid filters
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
          description: Reporting token is not scoped to this organization
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: Reporting rate or concurrency limit exceeded
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
          description: Reporting request timed out
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      deprecated: true
      security:
        - reporting_token: []
components:
  schemas:
    ReportingUsageSource:
      type: string
      enum:
        - all
        - inference
        - service
    ReportingUsageSummaryResponse:
      type: object
      required:
        - source
        - start_time
        - end_time
        - totals
        - by_workspace
        - by_api_key
        - by_model
        - by_service
        - by_day
      properties:
        by_api_key:
          type: array
          items:
            $ref: '#/components/schemas/ReportingApiKeySummary'
        by_day:
          type: array
          items:
            $ref: '#/components/schemas/ReportingDaySummary'
        by_model:
          type: array
          items:
            $ref: '#/components/schemas/ReportingModelSummary'
        by_service:
          type: array
          items:
            $ref: '#/components/schemas/ReportingServiceSummary'
        by_workspace:
          type: array
          items:
            $ref: '#/components/schemas/ReportingWorkspaceSummary'
        end_time:
          type: string
          format: date-time
        source:
          $ref: '#/components/schemas/ReportingUsageSource'
        start_time:
          type: string
          format: date-time
        totals:
          $ref: '#/components/schemas/ReportingUsageTotals'
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetail'
    ReportingApiKeySummary:
      type: object
      required:
        - api_key_id
        - request_count
        - service_usage_count
        - total_cost_nano_usd
      properties:
        api_key_id:
          type: string
          format: uuid
        request_count:
          type: integer
          format: int64
        service_usage_count:
          type: integer
          format: int64
        total_cost_nano_usd:
          type: integer
          format: int64
    ReportingDaySummary:
      type: object
      required:
        - day
        - request_count
        - service_usage_count
        - input_tokens
        - output_tokens
        - cache_read_tokens
        - total_tokens
        - inference_cost_nano_usd
        - service_cost_nano_usd
        - total_cost_nano_usd
      properties:
        cache_read_tokens:
          type: integer
          format: int64
        day:
          type: string
        inference_cost_nano_usd:
          type: integer
          format: int64
        input_tokens:
          type: integer
          format: int64
        output_tokens:
          type: integer
          format: int64
        request_count:
          type: integer
          format: int64
        service_cost_nano_usd:
          type: integer
          format: int64
        service_usage_count:
          type: integer
          format: int64
        total_cost_nano_usd:
          type: integer
          format: int64
        total_tokens:
          type: integer
          format: int64
    ReportingModelSummary:
      type: object
      required:
        - model
        - request_count
        - input_tokens
        - output_tokens
        - cache_read_tokens
        - total_tokens
        - total_cost_nano_usd
      properties:
        cache_read_tokens:
          type: integer
          format: int64
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
        total_cost_nano_usd:
          type: integer
          format: int64
        total_tokens:
          type: integer
          format: int64
    ReportingServiceSummary:
      type: object
      required:
        - service_name
        - usage_count
        - quantity
        - total_cost_nano_usd
      properties:
        quantity:
          type: integer
          format: int64
        service_name:
          type: string
        total_cost_nano_usd:
          type: integer
          format: int64
        usage_count:
          type: integer
          format: int64
    ReportingWorkspaceSummary:
      type: object
      required:
        - workspace_id
        - request_count
        - service_usage_count
        - total_cost_nano_usd
      properties:
        request_count:
          type: integer
          format: int64
        service_usage_count:
          type: integer
          format: int64
        total_cost_nano_usd:
          type: integer
          format: int64
        workspace_id:
          type: string
          format: uuid
    ReportingUsageTotals:
      type: object
      required:
        - request_count
        - service_usage_count
        - input_tokens
        - output_tokens
        - cache_read_tokens
        - total_tokens
        - inference_cost_nano_usd
        - service_cost_nano_usd
        - total_cost_nano_usd
      properties:
        cache_read_tokens:
          type: integer
          format: int64
        inference_cost_nano_usd:
          type: integer
          format: int64
        input_tokens:
          type: integer
          format: int64
        output_tokens:
          type: integer
          format: int64
        request_count:
          type: integer
          format: int64
        service_cost_nano_usd:
          type: integer
          format: int64
        service_usage_count:
          type: integer
          format: int64
        total_cost_nano_usd:
          type: integer
          format: int64
        total_cost_usd:
          type:
            - string
            - 'null'
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
    reporting_token:
      type: http
      scheme: bearer
      bearerFormat: reporting_token
      description: >-
        Read-only reporting token for usage reporting endpoints (Authorization:
        Bearer rpt-<reporting_token>)

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.