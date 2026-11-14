> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental view state

> Returns the state (key-value pairs) of a contract based on the key prefix.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_view_state
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_view_state:
    post:
      description: >-
        Returns the state (key-value pairs) of a contract based on the key
        prefix.
      operationId: EXPERIMENTAL_view_state
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_view_state'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcViewStateResponse_and_RpcViewStateError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_view_state:
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
            - EXPERIMENTAL_view_state
          type: string
        params:
          $ref: '#/components/schemas/RpcViewStateRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_view_state
      type: object
    JsonRpcResponse_for_RpcViewStateResponse_and_RpcViewStateError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcViewStateResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcViewStateError'
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
      title: JsonRpcResponse_for_RpcViewStateResponse_and_RpcViewStateError
      type: object
    RpcViewStateRequest:
      oneOf:
        - properties:
            block_id:
              $ref: '#/components/schemas/BlockId'
          required:
            - block_id
          type: object
        - properties:
            finality:
              $ref: '#/components/schemas/Finality'
          required:
            - finality
          type: object
        - properties:
            sync_checkpoint:
              $ref: '#/components/schemas/SyncCheckpoint'
          required:
            - sync_checkpoint
          type: object
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        after_key_base64:
          anyOf:
            - $ref: '#/components/schemas/StoreKey'
            - enum:
                - null
              nullable: true
          default: null
          description: Resume listing after this key (exclusive); must start with `prefix`.
        include_proof:
          default: false
          type: boolean
        limit:
          default: null
          description: Maximum number of entries to return in this page.
          format: uint32
          minimum: 1
          nullable: true
          type: integer
        prefix_base64:
          $ref: '#/components/schemas/StoreKey'
      required:
        - account_id
        - prefix_base64
      title: RpcViewStateRequest
      type: object
    RpcViewStateResponse:
      description: Resulting state values for a view state query request
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        block_height:
          format: uint64
          minimum: 0
          type: integer
        last_key:
          anyOf:
            - $ref: '#/components/schemas/StoreKey'
            - enum:
                - null
              nullable: true
          description: >-
            Cursor to resume from: present when more entries remain, absent when
            the listing is complete.
        proof:
          items:
            type: string
          type: array
        values:
          items:
            $ref: '#/components/schemas/StateItem'
          type: array
      required:
        - values
        - block_height
        - block_hash
      type: object
    ErrorWrapper_for_RpcViewStateError:
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
              $ref: '#/components/schemas/RpcViewStateError'
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
    BlockId:
      anyOf:
        - format: uint64
          minimum: 0
          title: block_height
          type: integer
        - $ref: '#/components/schemas/CryptoHash'
    Finality:
      description: Different types of finality.
      enum:
        - optimistic
        - near-final
        - final
      type: string
    SyncCheckpoint:
      enum:
        - genesis
        - earliest_available
      type: string
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
    StoreKey:
      description: >-
        This type is used to mark keys (arrays of bytes) that are queried from
        store.


        NOTE: Currently, this type is only used in the view_client and RPC to be
        able to transparently

        pretty-serialize the bytes arrays as base64-encoded strings (see
        `serialize.rs`).
      format: bytes
      type: string
    CryptoHash:
      type: string
    StateItem:
      description: >-
        Item of the state, key and value are serialized in base64 and proof for
        inclusion of given state item.
      properties:
        key:
          $ref: '#/components/schemas/StoreKey'
        value:
          $ref: '#/components/schemas/StoreValue'
      required:
        - key
        - value
      type: object
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
    RpcViewStateError:
      oneOf:
        - properties:
            info:
              properties:
                block_reference:
                  $ref: '#/components/schemas/BlockReference'
              required:
                - block_reference
              type: object
            name:
              enum:
                - UNKNOWN_BLOCK
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - INVALID_ACCOUNT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - UNKNOWN_ACCOUNT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - UNINITIALIZED_ACCOUNT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                contract_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - contract_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - TOO_LARGE_CONTRACT_STATE
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
    StoreValue:
      description: >-
        This type is used to mark values returned from store (arrays of bytes).


        NOTE: Currently, this type is only used in the view_client and RPC to be
        able to transparently

        pretty-serialize the bytes arrays as base64-encoded strings (see
        `serialize.rs`).
      format: bytes
      type: string
    BlockReference:
      oneOf:
        - additionalProperties: false
          properties:
            block_id:
              $ref: '#/components/schemas/BlockId'
          required:
            - block_id
          type: object
        - additionalProperties: false
          properties:
            finality:
              $ref: '#/components/schemas/Finality'
          required:
            - finality
          type: object
        - additionalProperties: false
          properties:
            sync_checkpoint:
              $ref: '#/components/schemas/SyncCheckpoint'
          required:
            - sync_checkpoint
          type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.