> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental receipt to tx

> Resolves a receipt ID back to the originating transaction hash and sender account



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_receipt_to_tx
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_receipt_to_tx:
    post:
      description: >-
        Resolves a receipt ID back to the originating transaction hash and
        sender account
      operationId: EXPERIMENTAL_receipt_to_tx
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_receipt_to_tx
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcReceiptToTxResponse_and_RpcReceiptToTxError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_receipt_to_tx:
      properties:
        id:
          type: string
          default: dontcare
          description: JSON-RPC request id. Auto-populated; can be any string.
        jsonrpc:
          type: string
          default: '2.0'
          enum:
            - '2.0'
          description: JSON-RPC protocol version. Always `2.0`.
        method:
          enum:
            - EXPERIMENTAL_receipt_to_tx
          type: string
        params:
          $ref: '#/components/schemas/RpcReceiptToTxRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_receipt_to_tx
      type: object
    JsonRpcResponse_for_RpcReceiptToTxResponse_and_RpcReceiptToTxError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcReceiptToTxResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcReceiptToTxError'
          required:
            - error
          type: object
      properties:
        id:
          type: string
        jsonrpc:
          type: string
      required:
        - jsonrpc
        - id
      title: JsonRpcResponse_for_RpcReceiptToTxResponse_and_RpcReceiptToTxError
      type: object
    RpcReceiptToTxRequest:
      properties:
        block_height:
          description: |-
            Block height near where receipt was created. Enables hint fallback
            scan on column miss. Anchor refreshes to each scan-resolved parent's
            exact execution height; later ancestors bounded via causality
            (emit before execute), so subsequent column-miss scans go
            `Ancestor`. Bump `receipt_to_tx_max_hop_distance` if cold archival
            gaps exceed default 20.

            Cold-storage cost: per-row latency orders of magnitude over hot. To
            bound request cost:
              - Supply `block_height` within parent's `±window` (default 5).
              - Supply `shard_id`. Omit → all-shards enumeration until walker
                crosses `FromReceipt` hop, multiplying cold-read cost.
              - Don't widen `window` beyond indexer's accuracy; budget shared
                across full ancestry walk.

            Receipt-id-only queries against periods with `save_receipt_to_tx`
            disabled stay unsupported: column never written, no self-locating.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        receipt_id:
          $ref: '#/components/schemas/CryptoHash'
        shard_id:
          anyOf:
            - $ref: '#/components/schemas/ShardId'
            - enum:
                - null
              nullable: true
          description: |-
            Shard hint. Narrows scan to this shard at hint height. Omit to
            enumerate all tracked shards (higher cost). After walker crosses a
            receipt-origin hop, shard derived from parent's predecessor account
            and hint no longer applies. Best-effort across resharding: layout
            shifts can miss producer, walk returns `UnknownReceipt`.
        window:
          description: |-
            Pre-first-scan width: `±window` heights around hint. Caps at
            `receipt_to_tx_max_hint_window` (default 20). Ignored after first
            scan-resolved hop — walker switches to `Ancestor` mode at
            `receipt_to_tx_max_hop_distance` width.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
      required:
        - receipt_id
      title: RpcReceiptToTxRequest
      type: object
    RpcReceiptToTxResponse:
      properties:
        sender_account_id:
          $ref: '#/components/schemas/AccountId'
        transaction_hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - transaction_hash
        - sender_account_id
      type: object
    ErrorWrapper_for_RpcReceiptToTxError:
      oneOf:
        - properties:
            cause:
              $ref: '#/components/schemas/RpcRequestValidationErrorKind'
            name:
              enum:
                - REQUEST_VALIDATION_ERROR
              type: string
          required:
            - name
            - cause
          type: object
        - properties:
            cause:
              $ref: '#/components/schemas/RpcReceiptToTxError'
            name:
              enum:
                - HANDLER_ERROR
              type: string
          required:
            - name
            - cause
          type: object
        - properties:
            cause:
              $ref: '#/components/schemas/InternalError'
            name:
              enum:
                - INTERNAL_ERROR
              type: string
          required:
            - name
            - cause
          type: object
    CryptoHash:
      type: string
    ShardId:
      description: >-
        The shard identifier. It may be an arbitrary number - it does not need
        to be

        a number in the range 0..NUM_SHARDS. The shard ids do not need to be

        sequential or contiguous.


        The shard id is wrapped in a new type to prevent the old pattern of
        using

        indices in range 0..NUM_SHARDS and casting to ShardId. Once the
        transition

        if fully complete it potentially may be simplified to a regular type
        alias.
      format: uint64
      minimum: 0
      type: integer
    AccountId:
      description: >-
        NEAR Account Identifier.


        This is a unique, syntactically valid, human-readable account identifier
        on the NEAR network.


        [See the crate-level docs for information about
        validation.](index.html#account-id-rules)


        Also see [Error kind precedence](AccountId#error-kind-precedence).


        ## Examples


        ```

        use near_account_id::AccountId;


        let alice: AccountId = "alice.near".parse().unwrap();


        assert!("ƒelicia.near".parse::<AccountId>().is_err()); // (ƒ is not f)

        ```
      title: AccountId
      type: string
    RpcRequestValidationErrorKind:
      oneOf:
        - properties:
            info:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
            name:
              enum:
                - METHOD_NOT_FOUND
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                error_message:
                  type: string
              required:
                - error_message
              type: object
            name:
              enum:
                - PARSE_ERROR
              type: string
          required:
            - name
            - info
          type: object
    RpcReceiptToTxError:
      oneOf:
        - properties:
            info:
              properties:
                receipt_id:
                  $ref: '#/components/schemas/CryptoHash'
              required:
                - receipt_id
              type: object
            name:
              enum:
                - UNKNOWN_RECEIPT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                limit:
                  format: uint32
                  minimum: 0
                  type: integer
                receipt_id:
                  $ref: '#/components/schemas/CryptoHash'
              required:
                - receipt_id
                - limit
              type: object
            name:
              enum:
                - DEPTH_EXCEEDED
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                error_message:
                  type: string
              required:
                - error_message
              type: object
            name:
              enum:
                - UNSUPPORTED
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                error_message:
                  type: string
              required:
                - error_message
              type: object
            name:
              enum:
                - INTERNAL_ERROR
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            name:
              enum:
                - OUTCOMES_NOT_STORED
              type: string
          required:
            - name
          type: object
        - properties:
            info:
              properties:
                maximum:
                  format: uint64
                  minimum: 0
                  type: integer
                requested:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - requested
                - maximum
              type: object
            name:
              enum:
                - WINDOW_TOO_LARGE
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                error_message:
                  type: string
              required:
                - error_message
              type: object
            name:
              enum:
                - MALFORMED_HINT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                scanned:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - scanned
                - limit
              type: object
            name:
              enum:
                - BUDGET_EXCEEDED
              type: string
          required:
            - name
            - info
          type: object
    InternalError:
      oneOf:
        - properties:
            info:
              properties:
                error_message:
                  type: string
              required:
                - error_message
              type: object
            name:
              enum:
                - INTERNAL_ERROR
              type: string
          required:
            - name
            - info
          type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.