> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental light client block proof

> Returns the proofs for a transaction execution.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_light_client_block_proof
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_light_client_block_proof:
    post:
      description: Returns the proofs for a transaction execution.
      operationId: EXPERIMENTAL_light_client_block_proof
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_light_client_block_proof
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcLightClientBlockProofResponse_and_RpcLightClientProofError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_light_client_block_proof:
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
            - EXPERIMENTAL_light_client_block_proof
          type: string
        params:
          $ref: '#/components/schemas/RpcLightClientBlockProofRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_light_client_block_proof
      type: object
    JsonRpcResponse_for_RpcLightClientBlockProofResponse_and_RpcLightClientProofError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcLightClientBlockProofResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcLightClientProofError'
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
        JsonRpcResponse_for_RpcLightClientBlockProofResponse_and_RpcLightClientProofError
      type: object
    RpcLightClientBlockProofRequest:
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        light_client_head:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - block_hash
        - light_client_head
      title: RpcLightClientBlockProofRequest
      type: object
    RpcLightClientBlockProofResponse:
      properties:
        block_header_lite:
          $ref: '#/components/schemas/LightClientBlockLiteView'
        block_proof:
          items:
            $ref: '#/components/schemas/MerklePathItem'
          type: array
      required:
        - block_header_lite
        - block_proof
      type: object
    ErrorWrapper_for_RpcLightClientProofError:
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
              $ref: '#/components/schemas/RpcLightClientProofError'
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
    LightClientBlockLiteView:
      properties:
        inner_lite:
          $ref: '#/components/schemas/BlockHeaderInnerLiteView'
        inner_rest_hash:
          $ref: '#/components/schemas/CryptoHash'
        prev_block_hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - prev_block_hash
        - inner_rest_hash
        - inner_lite
      type: object
    MerklePathItem:
      properties:
        direction:
          $ref: '#/components/schemas/Direction'
        hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - hash
        - direction
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
    RpcLightClientProofError:
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
            info:
              properties:
                execution_outcome_shard_id:
                  $ref: '#/components/schemas/ShardId'
                number_or_shards:
                  format: uint
                  minimum: 0
                  type: integer
              required:
                - number_or_shards
                - execution_outcome_shard_id
              type: object
            name:
              enum:
                - INCONSISTENT_STATE
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                transaction_or_receipt_id:
                  $ref: '#/components/schemas/CryptoHash'
              required:
                - transaction_or_receipt_id
              type: object
            name:
              enum:
                - NOT_CONFIRMED
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                transaction_or_receipt_id:
                  $ref: '#/components/schemas/CryptoHash'
              required:
                - transaction_or_receipt_id
              type: object
            name:
              enum:
                - UNKNOWN_TRANSACTION_OR_RECEIPT
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
                transaction_or_receipt_id:
                  $ref: '#/components/schemas/CryptoHash'
              required:
                - transaction_or_receipt_id
                - shard_id
              type: object
            name:
              enum:
                - UNAVAILABLE_SHARD
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
                - SHARD_NOT_TRACKED
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                account_shard_id:
                  $ref: '#/components/schemas/ShardId'
                requested_shard_id:
                  $ref: '#/components/schemas/ShardId'
              required:
                - account_id
                - account_shard_id
                - requested_shard_id
              type: object
            name:
              enum:
                - TARGET_SHARD_MISMATCH
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                chunk_id:
                  $ref: '#/components/schemas/SpiceChunkId'
              required:
                - chunk_id
              type: object
            name:
              enum:
                - STATE_NOT_AVAILABLE
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                chunk_id:
                  $ref: '#/components/schemas/SpiceChunkId'
              required:
                - chunk_id
              type: object
            name:
              enum:
                - CHUNK_NOT_CERTIFIED
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                certifying_block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                chunk_id:
                  $ref: '#/components/schemas/SpiceChunkId'
                head_height:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - chunk_id
                - certifying_block_height
                - head_height
              type: object
            name:
              enum:
                - LIGHT_CLIENT_HEAD_TOO_OLD
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
    BlockHeaderInnerLiteView:
      description: >-
        A part of a state for the current head of a light client. More info
        [here](https://nomicon.io/ChainSpec/LightClient).
      properties:
        block_merkle_root:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: The merkle root of all the block hashes
        chunk_execution_root:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
          description: |-
            Merkle root over the block's certified chunk execution results.
            `None` for pre-spice headers.
        epoch_id:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: The epoch to which the block that is the current known head belongs
        height:
          format: uint64
          minimum: 0
          type: integer
        next_bp_hash:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: The hash of the block producers set for the next epoch
        next_epoch_id:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: The epoch that will follow the current epoch
        outcome_root:
          $ref: '#/components/schemas/CryptoHash'
        prev_state_root:
          $ref: '#/components/schemas/CryptoHash'
        timestamp:
          description: Legacy json number. Should not be used.
          format: uint64
          minimum: 0
          type: integer
        timestamp_nanosec:
          type: string
      required:
        - height
        - epoch_id
        - next_epoch_id
        - prev_state_root
        - outcome_root
        - timestamp
        - timestamp_nanosec
        - next_bp_hash
        - block_merkle_root
      type: object
    Direction:
      enum:
        - Left
        - Right
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
    SpiceChunkId:
      description: >-
        In spice missing chunks and equivalent to empty chunks so block hash and
        shard id always

        uniquely identifies chunks.
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        shard_id:
          $ref: '#/components/schemas/ShardId'
      required:
        - block_hash
        - shard_id
      type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.