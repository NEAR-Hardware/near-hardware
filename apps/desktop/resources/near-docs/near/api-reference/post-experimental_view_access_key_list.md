> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental view access key list

> Returns all access keys for a given account.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_view_access_key_list
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_view_access_key_list:
    post:
      description: Returns all access keys for a given account.
      operationId: EXPERIMENTAL_view_access_key_list
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_view_access_key_list
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcViewAccessKeyListResponse_and_RpcViewAccessKeyListError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_view_access_key_list:
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
            - EXPERIMENTAL_view_access_key_list
          type: string
        params:
          $ref: '#/components/schemas/RpcViewAccessKeyListRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_view_access_key_list
      type: object
    JsonRpcResponse_for_RpcViewAccessKeyListResponse_and_RpcViewAccessKeyListError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcViewAccessKeyListResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcViewAccessKeyListError'
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
        JsonRpcResponse_for_RpcViewAccessKeyListResponse_and_RpcViewAccessKeyListError
      type: object
    RpcViewAccessKeyListRequest:
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
        after_key:
          anyOf:
            - $ref: '#/components/schemas/PublicKeyHandle'
            - enum:
                - null
              nullable: true
          description: >-
            Pagination cursor: resume the listing strictly after this access
            key.

            Pass the `last_key` returned by the previous page.
        limit:
          description: Maximum number of access keys to return in this page.
          format: uint32
          minimum: 1
          nullable: true
          type: integer
      required:
        - account_id
      title: RpcViewAccessKeyListRequest
      type: object
    RpcViewAccessKeyListResponse:
      description: Lists access keys
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        block_height:
          format: uint64
          minimum: 0
          type: integer
        keys:
          items:
            $ref: '#/components/schemas/AccessKeyInfoView'
          type: array
        last_key:
          anyOf:
            - $ref: '#/components/schemas/PublicKeyHandle'
            - enum:
                - null
              nullable: true
          description: >-
            Pagination cursor. When `Some`, the listing was truncated and the
            caller

            should issue another request with `after_key` set to this handle to
            fetch

            the next page. `None` means this was the last page.
      required:
        - keys
        - block_height
        - block_hash
      type: object
    ErrorWrapper_for_RpcViewAccessKeyListError:
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
              $ref: '#/components/schemas/RpcViewAccessKeyListError'
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
    PublicKeyHandle:
      type: string
    CryptoHash:
      type: string
    AccessKeyInfoView:
      description: |-
        Describes information about an access key including its on-trie
        identifier. For ed25519/secp256k1 access keys the `public_key` field
        is the full public key (string form unchanged from before); for
        ML-DSA-65 access keys it is a `ml-dsa-65-hash:...` SHA3-256 digest
        (the full pubkey is not stored on-chain).
      properties:
        access_key:
          $ref: '#/components/schemas/AccessKeyView'
        public_key:
          $ref: '#/components/schemas/PublicKeyHandle'
      required:
        - public_key
        - access_key
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
    RpcViewAccessKeyListError:
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
                limit:
                  format: uint32
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - limit
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - TOO_MANY_ACCESS_KEYS
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
    AccessKeyView:
      description: Describes access key permission scope and nonce.
      properties:
        nonce:
          description: >-
            Current nonce; each transaction signed with this key must use a
            strictly greater value.
          format: uint64
          minimum: 0
          type: integer
        permission:
          allOf:
            - $ref: '#/components/schemas/AccessKeyPermissionView'
          description: >-
            Access scope: full access, or a function-call permission with an
            optional allowance and method/receiver limits.
      required:
        - nonce
        - permission
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
    AccessKeyPermissionView:
      description: >-
        Describes the permission scope for an access key. Whether it is a
        function call or a full access key.
      oneOf:
        - enum:
            - FullAccess
          type: string
        - additionalProperties: false
          properties:
            FunctionCall:
              properties:
                allowance:
                  anyOf:
                    - $ref: '#/components/schemas/NearToken'
                    - enum:
                        - null
                      nullable: true
                method_names:
                  items:
                    type: string
                  type: array
                receiver_id:
                  type: string
              required:
                - receiver_id
                - method_names
              type: object
          required:
            - FunctionCall
          type: object
        - additionalProperties: false
          properties:
            GasKeyFunctionCall:
              properties:
                allowance:
                  anyOf:
                    - $ref: '#/components/schemas/NearToken'
                    - enum:
                        - null
                      nullable: true
                balance:
                  $ref: '#/components/schemas/NearToken'
                method_names:
                  items:
                    type: string
                  type: array
                num_nonces:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
                receiver_id:
                  type: string
              required:
                - balance
                - num_nonces
                - receiver_id
                - method_names
              type: object
          required:
            - GasKeyFunctionCall
          type: object
        - additionalProperties: false
          properties:
            GasKeyFullAccess:
              properties:
                balance:
                  $ref: '#/components/schemas/NearToken'
                num_nonces:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
              required:
                - balance
                - num_nonces
              type: object
          required:
            - GasKeyFullAccess
          type: object
    NearToken:
      type: string

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.