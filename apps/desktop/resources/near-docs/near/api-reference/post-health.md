> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post health

> Returns the current health status of the RPC node the client connects to.



## OpenAPI

````yaml /openapi.json post /health
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /health:
    post:
      description: >-
        Returns the current health status of the RPC node the client connects
        to.
      operationId: health
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_health'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_Nullable_RpcHealthResponse_and_RpcStatusError
components:
  schemas:
    JsonRpcRequest_for_health:
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
            - health
          type: string
        params:
          $ref: '#/components/schemas/RpcHealthRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_health
      type: object
    JsonRpcResponse_for_Nullable_RpcHealthResponse_and_RpcStatusError:
      oneOf:
        - properties:
            result:
              anyOf:
                - $ref: '#/components/schemas/RpcHealthResponse'
                - enum:
                    - null
                  nullable: true
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcStatusError'
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
      title: JsonRpcResponse_for_Nullable_RpcHealthResponse_and_RpcStatusError
      type: object
    RpcHealthRequest:
      enum:
        - null
      nullable: true
      title: RpcHealthRequest
    RpcHealthResponse:
      enum:
        - null
      nullable: true
    ErrorWrapper_for_RpcStatusError:
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
              $ref: '#/components/schemas/RpcStatusError'
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
    RpcStatusError:
      oneOf:
        - properties:
            name:
              enum:
                - NODE_IS_SYNCING
              type: string
          required:
            - name
          type: object
        - properties:
            info:
              properties:
                elapsed:
                  items:
                    format: uint64
                    minimum: 0
                    type: integer
                  maxItems: 2
                  minItems: 2
                  type: array
              required:
                - elapsed
              type: object
            name:
              enum:
                - NO_NEW_BLOCKS
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                epoch_id:
                  $ref: '#/components/schemas/EpochId'
              required:
                - epoch_id
              type: object
            name:
              enum:
                - EPOCH_OUT_OF_BOUNDS
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
    EpochId:
      allOf:
        - $ref: '#/components/schemas/CryptoHash'
      description: |-
        Epoch identifier -- wrapped hash, to make it easier to distinguish.
        EpochId of epoch T is the hash of last block in T-2
        EpochId of first two epochs is 0
    CryptoHash:
      type: string

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.