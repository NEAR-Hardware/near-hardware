> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post block effects

> Returns changes in block for given block height or hash over all transactions for all the types. Includes changes like account_touched, access_key_touched, data_touched, contract_code_touched.



## OpenAPI

````yaml /openapi.json post /block_effects
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /block_effects:
    post:
      description: >-
        Returns changes in block for given block height or hash over all
        transactions for all the types. Includes changes like account_touched,
        access_key_touched, data_touched, contract_code_touched.
      operationId: block_effects
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_block_effects'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcStateChangesInBlockByTypeResponse_and_RpcStateChangesError
components:
  schemas:
    JsonRpcRequest_for_block_effects:
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
            - block_effects
          type: string
        params:
          $ref: '#/components/schemas/RpcStateChangesInBlockRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_block_effects
      type: object
    JsonRpcResponse_for_RpcStateChangesInBlockByTypeResponse_and_RpcStateChangesError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcStateChangesInBlockByTypeResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcStateChangesError'
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
      title: >-
        JsonRpcResponse_for_RpcStateChangesInBlockByTypeResponse_and_RpcStateChangesError
      type: object
    RpcStateChangesInBlockRequest:
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
      title: RpcStateChangesInBlockRequest
      type: object
    RpcStateChangesInBlockByTypeResponse:
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        changes:
          items:
            $ref: '#/components/schemas/StateChangeKindView'
          type: array
      required:
        - block_hash
        - changes
      type: object
    ErrorWrapper_for_RpcStateChangesError:
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
              $ref: '#/components/schemas/RpcStateChangesError'
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
    CryptoHash:
      type: string
    StateChangeKindView:
      description: |-
        It is a [serializable view] of [`StateChangeKind`].

        [serializable view]: ./index.html
        [`StateChangeKind`]: ../types/struct.StateChangeKind.html
      oneOf:
        - properties:
            account_id:
              $ref: '#/components/schemas/AccountId'
            type:
              enum:
                - account_touched
              type: string
          required:
            - type
            - account_id
          type: object
        - properties:
            account_id:
              $ref: '#/components/schemas/AccountId'
            type:
              enum:
                - access_key_touched
              type: string
          required:
            - type
            - account_id
          type: object
        - properties:
            account_id:
              $ref: '#/components/schemas/AccountId'
            type:
              enum:
                - data_touched
              type: string
          required:
            - type
            - account_id
          type: object
        - properties:
            account_id:
              $ref: '#/components/schemas/AccountId'
            type:
              enum:
                - contract_code_touched
              type: string
          required:
            - type
            - account_id
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
    RpcStateChangesError:
      oneOf:
        - properties:
            info:
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
            name:
              enum:
                - NOT_SYNCED_YET
              type: string
          required:
            - name
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
            info:
              properties:
                shard_id:
                  $ref: '#/components/schemas/ShardId'
              required:
                - shard_id
              type: object
            name:
              enum:
                - SHARD_NOT_APPLIED
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.