> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental congestion level

> Queries the congestion level of a shard. More info about congestion [here](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_congestion_level
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_congestion_level:
    post:
      description: >-
        Queries the congestion level of a shard. More info about congestion
        [here](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)
      operationId: EXPERIMENTAL_congestion_level
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_congestion_level
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcCongestionLevelResponse_and_RpcChunkError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_congestion_level:
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
            - EXPERIMENTAL_congestion_level
          type: string
        params:
          $ref: '#/components/schemas/RpcCongestionLevelRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_congestion_level
      type: object
    JsonRpcResponse_for_RpcCongestionLevelResponse_and_RpcChunkError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcCongestionLevelResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcChunkError'
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
      title: JsonRpcResponse_for_RpcCongestionLevelResponse_and_RpcChunkError
      type: object
    RpcCongestionLevelRequest:
      anyOf:
        - properties:
            block_id:
              $ref: '#/components/schemas/BlockId'
            shard_id:
              $ref: '#/components/schemas/ShardId'
          required:
            - block_id
            - shard_id
          title: block_shard_id
          type: object
        - properties:
            chunk_id:
              $ref: '#/components/schemas/CryptoHash'
          required:
            - chunk_id
          title: chunk_hash
          type: object
      title: RpcCongestionLevelRequest
      type: object
    RpcCongestionLevelResponse:
      properties:
        congestion_level:
          format: double
          type: number
      required:
        - congestion_level
      type: object
    ErrorWrapper_for_RpcChunkError:
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
              $ref: '#/components/schemas/RpcChunkError'
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
    RpcChunkError:
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
                shard_id:
                  $ref: '#/components/schemas/ShardId'
              required:
                - shard_id
              type: object
            name:
              enum:
                - INVALID_SHARD_ID
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                chunk_hash:
                  $ref: '#/components/schemas/ChunkHash'
              required:
                - chunk_hash
              type: object
            name:
              enum:
                - UNKNOWN_CHUNK
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
    ChunkHash:
      $ref: '#/components/schemas/CryptoHash'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.