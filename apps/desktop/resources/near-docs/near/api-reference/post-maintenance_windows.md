> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post maintenance windows

> Returns the future windows for maintenance in current epoch for the specified account. In the maintenance windows, the node will not be block producer or chunk producer.



## OpenAPI

````yaml /openapi.json post /maintenance_windows
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /maintenance_windows:
    post:
      description: >-
        Returns the future windows for maintenance in current epoch for the
        specified account. In the maintenance windows, the node will not be
        block producer or chunk producer.
      operationId: maintenance_windows
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_maintenance_windows'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_Array_of_Range_of_uint64_and_RpcMaintenanceWindowsError
components:
  schemas:
    JsonRpcRequest_for_maintenance_windows:
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
            - maintenance_windows
          type: string
        params:
          $ref: '#/components/schemas/RpcMaintenanceWindowsRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_maintenance_windows
      type: object
    JsonRpcResponse_for_Array_of_Range_of_uint64_and_RpcMaintenanceWindowsError:
      oneOf:
        - properties:
            result:
              items:
                $ref: '#/components/schemas/Range_of_uint64'
              type: array
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcMaintenanceWindowsError'
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
        JsonRpcResponse_for_Array_of_Range_of_uint64_and_RpcMaintenanceWindowsError
      type: object
    RpcMaintenanceWindowsRequest:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
      required:
        - account_id
      title: RpcMaintenanceWindowsRequest
      type: object
    Range_of_uint64:
      properties:
        end:
          format: uint64
          minimum: 0
          type: integer
        start:
          format: uint64
          minimum: 0
          type: integer
      required:
        - start
        - end
      type: object
    ErrorWrapper_for_RpcMaintenanceWindowsError:
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
              $ref: '#/components/schemas/RpcMaintenanceWindowsError'
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
    RpcMaintenanceWindowsError:
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