> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental split storage info

> Contains the split storage information. More info on split storage [here](https://near-nodes.io/archival/split-storage-archival)



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_split_storage_info
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_split_storage_info:
    post:
      description: >-
        Contains the split storage information. More info on split storage
        [here](https://near-nodes.io/archival/split-storage-archival)
      operationId: EXPERIMENTAL_split_storage_info
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_split_storage_info
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcSplitStorageInfoResponse_and_RpcSplitStorageInfoError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_split_storage_info:
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
            - EXPERIMENTAL_split_storage_info
          type: string
        params:
          $ref: '#/components/schemas/RpcSplitStorageInfoRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_split_storage_info
      type: object
    JsonRpcResponse_for_RpcSplitStorageInfoResponse_and_RpcSplitStorageInfoError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcSplitStorageInfoResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcSplitStorageInfoError'
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
        JsonRpcResponse_for_RpcSplitStorageInfoResponse_and_RpcSplitStorageInfoError
      type: object
    RpcSplitStorageInfoRequest:
      title: RpcSplitStorageInfoRequest
      type: object
    RpcSplitStorageInfoResponse:
      description: Contains the split storage information.
      properties:
        cold_head_height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        final_head_height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        head_height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        hot_db_kind:
          nullable: true
          type: string
      type: object
    ErrorWrapper_for_RpcSplitStorageInfoError:
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
              $ref: '#/components/schemas/RpcSplitStorageInfoError'
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
    RpcSplitStorageInfoError:
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