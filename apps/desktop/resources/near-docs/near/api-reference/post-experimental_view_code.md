> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental view code

> Returns the contract code (Wasm binary) deployed to the account.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_view_code
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_view_code:
    post:
      description: Returns the contract code (Wasm binary) deployed to the account.
      operationId: EXPERIMENTAL_view_code
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_view_code'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcViewCodeResponse_and_RpcViewCodeError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_view_code:
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
            - EXPERIMENTAL_view_code
          type: string
        params:
          $ref: '#/components/schemas/RpcViewCodeRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_view_code
      type: object
    JsonRpcResponse_for_RpcViewCodeResponse_and_RpcViewCodeError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcViewCodeResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcViewCodeError'
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
      title: JsonRpcResponse_for_RpcViewCodeResponse_and_RpcViewCodeError
      type: object
    RpcViewCodeRequest:
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
      required:
        - account_id
      title: RpcViewCodeRequest
      type: object
    RpcViewCodeResponse:
      description: A view of the contract code.
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        block_height:
          format: uint64
          minimum: 0
          type: integer
        code_base64:
          type: string
        hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - code_base64
        - hash
        - block_height
        - block_hash
      type: object
    ErrorWrapper_for_RpcViewCodeError:
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
              $ref: '#/components/schemas/RpcViewCodeError'
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
    CryptoHash:
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
    RpcViewCodeError:
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
                - NO_CONTRACT_CODE
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