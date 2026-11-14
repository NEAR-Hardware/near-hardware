> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post query

> This module allows you to make generic requests to the network.

The `RpcQueryRequest` struct takes in a [`BlockReference`](https://docs.rs/near-primitives/0.12.0/near_primitives/types/enum.BlockReference.html) and a [`QueryRequest`](https://docs.rs/near-primitives/0.12.0/near_primitives/views/enum.QueryRequest.html).

The `BlockReference` enum allows you to specify a block by `Finality`, `BlockId` or `SyncCheckpoint`.

The `QueryRequest` enum provides multiple variants for performing the following actions:
 - View an account's details
 - View a contract's code
 - View the state of an account
 - View the `AccessKey` of an account
 - View the `AccessKeyList` of an account
 - Call a function in a contract deployed on the network.



## OpenAPI

````yaml /openapi.json post /query
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /query:
    post:
      description: >-
        This module allows you to make generic requests to the network.


        The `RpcQueryRequest` struct takes in a
        [`BlockReference`](https://docs.rs/near-primitives/0.12.0/near_primitives/types/enum.BlockReference.html)
        and a
        [`QueryRequest`](https://docs.rs/near-primitives/0.12.0/near_primitives/views/enum.QueryRequest.html).


        The `BlockReference` enum allows you to specify a block by `Finality`,
        `BlockId` or `SyncCheckpoint`.


        The `QueryRequest` enum provides multiple variants for performing the
        following actions:
         - View an account's details
         - View a contract's code
         - View the state of an account
         - View the `AccessKey` of an account
         - View the `AccessKeyList` of an account
         - Call a function in a contract deployed on the network.
      operationId: query
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_query'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcQueryResponse_and_RpcQueryError
components:
  schemas:
    JsonRpcRequest_for_query:
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
            - query
          type: string
        params:
          $ref: '#/components/schemas/RpcQueryRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_query
      type: object
    JsonRpcResponse_for_RpcQueryResponse_and_RpcQueryError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcQueryResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcQueryError'
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
      title: JsonRpcResponse_for_RpcQueryResponse_and_RpcQueryError
      type: object
    RpcQueryRequest:
      oneOf:
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_account
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_account_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_code
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_code_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                after_key_base64:
                  anyOf:
                    - $ref: '#/components/schemas/StoreKey'
                    - enum:
                        - null
                      nullable: true
                include_proof:
                  type: boolean
                limit:
                  format: uint32
                  minimum: 1
                  nullable: true
                  type: integer
                prefix_base64:
                  $ref: '#/components/schemas/StoreKey'
                request_type:
                  enum:
                    - view_state
                  type: string
              required:
                - request_type
                - account_id
                - prefix_base64
              type: object
          title: view_state_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                request_type:
                  enum:
                    - view_access_key
                  type: string
              required:
                - request_type
                - account_id
                - public_key
              type: object
          title: view_access_key_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                after_key:
                  anyOf:
                    - $ref: '#/components/schemas/PublicKeyHandle'
                    - enum:
                        - null
                      nullable: true
                limit:
                  format: uint32
                  minimum: 1
                  nullable: true
                  type: integer
                request_type:
                  enum:
                    - view_access_key_list
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_access_key_list_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                request_type:
                  enum:
                    - view_gas_key_nonces
                  type: string
              required:
                - request_type
                - account_id
                - public_key
              type: object
          title: view_gas_key_nonces_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                args_base64:
                  $ref: '#/components/schemas/FunctionArgs'
                method_name:
                  type: string
                request_type:
                  enum:
                    - call_function
                  type: string
              required:
                - request_type
                - account_id
                - method_name
                - args_base64
              type: object
          title: call_function_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                code_hash:
                  $ref: '#/components/schemas/CryptoHash'
                request_type:
                  enum:
                    - view_global_contract_code
                  type: string
              required:
                - request_type
                - code_hash
              type: object
          title: view_global_contract_code_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_global_contract_code_by_account_id
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_global_contract_code_by_account_id_by_block_id
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_account
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_account_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_code
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_code_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                after_key_base64:
                  anyOf:
                    - $ref: '#/components/schemas/StoreKey'
                    - enum:
                        - null
                      nullable: true
                include_proof:
                  type: boolean
                limit:
                  format: uint32
                  minimum: 1
                  nullable: true
                  type: integer
                prefix_base64:
                  $ref: '#/components/schemas/StoreKey'
                request_type:
                  enum:
                    - view_state
                  type: string
              required:
                - request_type
                - account_id
                - prefix_base64
              type: object
          title: view_state_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                request_type:
                  enum:
                    - view_access_key
                  type: string
              required:
                - request_type
                - account_id
                - public_key
              type: object
          title: view_access_key_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                after_key:
                  anyOf:
                    - $ref: '#/components/schemas/PublicKeyHandle'
                    - enum:
                        - null
                      nullable: true
                limit:
                  format: uint32
                  minimum: 1
                  nullable: true
                  type: integer
                request_type:
                  enum:
                    - view_access_key_list
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_access_key_list_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                request_type:
                  enum:
                    - view_gas_key_nonces
                  type: string
              required:
                - request_type
                - account_id
                - public_key
              type: object
          title: view_gas_key_nonces_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                args_base64:
                  $ref: '#/components/schemas/FunctionArgs'
                method_name:
                  type: string
                request_type:
                  enum:
                    - call_function
                  type: string
              required:
                - request_type
                - account_id
                - method_name
                - args_base64
              type: object
          title: call_function_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                code_hash:
                  $ref: '#/components/schemas/CryptoHash'
                request_type:
                  enum:
                    - view_global_contract_code
                  type: string
              required:
                - request_type
                - code_hash
              type: object
          title: view_global_contract_code_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_global_contract_code_by_account_id
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_global_contract_code_by_account_id_by_finality
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_account
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_account_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_code
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_code_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                after_key_base64:
                  anyOf:
                    - $ref: '#/components/schemas/StoreKey'
                    - enum:
                        - null
                      nullable: true
                include_proof:
                  type: boolean
                limit:
                  format: uint32
                  minimum: 1
                  nullable: true
                  type: integer
                prefix_base64:
                  $ref: '#/components/schemas/StoreKey'
                request_type:
                  enum:
                    - view_state
                  type: string
              required:
                - request_type
                - account_id
                - prefix_base64
              type: object
          title: view_state_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                request_type:
                  enum:
                    - view_access_key
                  type: string
              required:
                - request_type
                - account_id
                - public_key
              type: object
          title: view_access_key_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                after_key:
                  anyOf:
                    - $ref: '#/components/schemas/PublicKeyHandle'
                    - enum:
                        - null
                      nullable: true
                limit:
                  format: uint32
                  minimum: 1
                  nullable: true
                  type: integer
                request_type:
                  enum:
                    - view_access_key_list
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_access_key_list_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                request_type:
                  enum:
                    - view_gas_key_nonces
                  type: string
              required:
                - request_type
                - account_id
                - public_key
              type: object
          title: view_gas_key_nonces_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                args_base64:
                  $ref: '#/components/schemas/FunctionArgs'
                method_name:
                  type: string
                request_type:
                  enum:
                    - call_function
                  type: string
              required:
                - request_type
                - account_id
                - method_name
                - args_base64
              type: object
          title: call_function_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                code_hash:
                  $ref: '#/components/schemas/CryptoHash'
                request_type:
                  enum:
                    - view_global_contract_code
                  type: string
              required:
                - request_type
                - code_hash
              type: object
          title: view_global_contract_code_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                request_type:
                  enum:
                    - view_global_contract_code_by_account_id
                  type: string
              required:
                - request_type
                - account_id
              type: object
          title: view_global_contract_code_by_account_id_by_sync_checkpoint
      title: RpcQueryRequest
      type: object
    RpcQueryResponse:
      anyOf:
        - $ref: '#/components/schemas/AccountView'
        - $ref: '#/components/schemas/ContractCodeView'
        - $ref: '#/components/schemas/ViewStateResult'
        - $ref: '#/components/schemas/CallResult'
        - $ref: '#/components/schemas/AccessKeyView'
        - $ref: '#/components/schemas/AccessKeyList'
        - $ref: '#/components/schemas/GasKeyNoncesView'
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        block_height:
          format: uint64
          minimum: 0
          type: integer
      required:
        - block_height
        - block_hash
      type: object
    ErrorWrapper_for_RpcQueryError:
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
              $ref: '#/components/schemas/RpcQueryError'
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
    PublicKey:
      type: string
    PublicKeyHandle:
      type: string
    FunctionArgs:
      description: >-
        This type is used to mark function arguments.


        NOTE: The main reason for this to exist (except the type-safety) is that
        the value is

        transparently serialized and deserialized as a base64-encoded string
        when serde is used

        (serde_json).
      format: bytes
      type: string
    CryptoHash:
      type: string
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
    AccountView:
      description: A view of the account
      properties:
        amount:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Liquid (non-staked) account balance, in yoctoNEAR.
        bootstrap_nonce:
          description: >-
            The nonce an uninitialized account's own transactions must use,
            present

            only while it is uninitialized. A self-signed state init is the one

            transaction such an account can send, and this is the only way for a

            client to learn the nonce it must carry: there is no access key to
            query.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        code_hash:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: >-
            Hash of the deployed contract code; the all-`1`s hash when no
            contract is deployed.
        global_contract_account_id:
          anyOf:
            - $ref: '#/components/schemas/AccountId'
            - enum:
                - null
              nullable: true
          description: >-
            Set when the account uses a global contract referenced by the
            deploying account id.
        global_contract_hash:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
          description: Set when the account uses a global contract referenced by code hash.
        locked:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Staked balance locked for validation, in yoctoNEAR.
        state:
          allOf:
            - $ref: '#/components/schemas/AccountState'
          description: |-
            Whether the account is initialized. Only a universal account can be
            uninitialized: it has no access keys, code or data until a
            `UniversalStateInit` arrives. Omitted for initialized accounts.
        storage_paid_at:
          default: 0
          description: 'Deprecated and unused. TODO(2271): remove.'
          format: uint64
          minimum: 0
          type: integer
        storage_usage:
          description: Total storage used by the account, in bytes.
          format: uint64
          minimum: 0
          type: integer
      required:
        - amount
        - locked
        - code_hash
        - storage_usage
      type: object
    ContractCodeView:
      description: A view of the contract code.
      properties:
        code_base64:
          type: string
        hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - code_base64
        - hash
      type: object
    ViewStateResult:
      description: Resulting state values for a view state query request
      properties:
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
      type: object
    CallResult:
      description: A result returned by contract method
      properties:
        logs:
          items:
            type: string
          type: array
        result:
          items:
            format: uint8
            maximum: 255
            minimum: 0
            type: integer
          type: array
      required:
        - result
        - logs
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
    AccessKeyList:
      description: Lists access keys
      properties:
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
      type: object
    GasKeyNoncesView:
      description: Gas key nonces view returned by the `view_gas_key_nonces` RPC query.
      properties:
        nonces:
          items:
            format: uint64
            minimum: 0
            type: integer
          type: array
      required:
        - nonces
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
    RpcQueryError:
      oneOf:
        - properties:
            name:
              enum:
                - NO_SYNCED_BLOCKS
              type: string
          required:
            - name
          type: object
        - properties:
            info:
              properties:
                requested_shard_id:
                  $ref: '#/components/schemas/ShardId'
              required:
                - requested_shard_id
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
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - GARBAGE_COLLECTED_BLOCK
              type: string
          required:
            - name
            - info
          type: object
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
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - UNKNOWN_ACCESS_KEY
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
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - UNKNOWN_GAS_KEY
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
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                error:
                  $ref: '#/components/schemas/FunctionCallError'
                vm_error:
                  type: string
              required:
                - vm_error
                - error
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - CONTRACT_EXECUTION_ERROR
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
                identifier:
                  $ref: '#/components/schemas/GlobalContractIdentifier'
              required:
                - identifier
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - NO_GLOBAL_CONTRACT_CODE
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
    NearToken:
      type: string
    AccountState:
      description: >-
        Whether an account's state has been installed.


        Only universal accounts can be uninitialized: they come into existence
        when

        a transfer funds a `0u` id whose state init has not been applied yet. A

        deterministic `0s` account waiting for its state init is an ordinary V1

        account with no contract, not this.
      enum:
        - initialized
        - uninitialized
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
    FunctionCallError:
      description: >-
        Serializable version of `near-vm-runner::FunctionCallError`.


        Must never reorder/remove elements, can only add new variants at the end
        (but do that very

        carefully). It describes stable serialization format, and only used by
        serialization logic.
      oneOf:
        - enum:
            - WasmUnknownError
            - _EVMError
          type: string
        - additionalProperties: false
          description: Wasm compilation error
          properties:
            CompilationError:
              $ref: '#/components/schemas/CompilationError'
          required:
            - CompilationError
          type: object
        - additionalProperties: false
          description: >-
            Wasm binary env link error


            Note: this is only to deserialize old data, use execution error for
            new data
          properties:
            LinkError:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - LinkError
          type: object
        - additionalProperties: false
          description: Import/export resolve error
          properties:
            MethodResolveError:
              $ref: '#/components/schemas/MethodResolveError'
          required:
            - MethodResolveError
          type: object
        - additionalProperties: false
          description: >-
            A trap happened during execution of a binary


            Note: this is only to deserialize old data, use execution error for
            new data
          properties:
            WasmTrap:
              $ref: '#/components/schemas/WasmTrap'
          required:
            - WasmTrap
          type: object
        - additionalProperties: false
          description: >-
            Note: this is only to deserialize old data, use execution error for
            new data
          properties:
            HostError:
              $ref: '#/components/schemas/HostError'
          required:
            - HostError
          type: object
        - additionalProperties: false
          properties:
            ExecutionError:
              type: string
          required:
            - ExecutionError
          type: object
    GlobalContractIdentifier:
      oneOf:
        - additionalProperties: false
          properties:
            hash:
              $ref: '#/components/schemas/CryptoHash'
          required:
            - hash
          type: object
        - additionalProperties: false
          properties:
            account_id:
              $ref: '#/components/schemas/AccountId'
          required:
            - account_id
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
    CompilationError:
      oneOf:
        - additionalProperties: false
          properties:
            CodeDoesNotExist:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - CodeDoesNotExist
          type: object
        - additionalProperties: false
          properties:
            PrepareError:
              $ref: '#/components/schemas/PrepareError'
          required:
            - PrepareError
          type: object
        - additionalProperties: false
          description: >-
            This is for defense in depth.

            We expect our runtime-independent preparation code to fully catch
            all invalid wasms,

            but, if it ever misses something we’ll emit this error
          properties:
            WasmerCompileError:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - WasmerCompileError
          type: object
    MethodResolveError:
      enum:
        - MethodEmptyName
        - MethodNotFound
        - MethodInvalidSignature
      type: string
    WasmTrap:
      description: A kind of a trap happened during execution of a binary
      oneOf:
        - description: An `unreachable` opcode was executed.
          enum:
            - Unreachable
          type: string
        - description: Call indirect incorrect signature trap.
          enum:
            - IncorrectCallIndirectSignature
          type: string
        - description: Memory out of bounds trap.
          enum:
            - MemoryOutOfBounds
          type: string
        - description: Call indirect out of bounds trap.
          enum:
            - CallIndirectOOB
          type: string
        - description: An arithmetic exception, e.g. divided by zero.
          enum:
            - IllegalArithmetic
          type: string
        - description: Misaligned atomic access trap.
          enum:
            - MisalignedAtomicAccess
          type: string
        - description: Indirect call to null.
          enum:
            - IndirectCallToNull
          type: string
        - description: Stack overflow.
          enum:
            - StackOverflow
          type: string
        - description: Generic trap.
          enum:
            - GenericTrap
          type: string
    HostError:
      oneOf:
        - description: String encoding is bad UTF-16 sequence
          enum:
            - BadUTF16
          type: string
        - description: String encoding is bad UTF-8 sequence
          enum:
            - BadUTF8
          type: string
        - description: Exceeded the prepaid gas
          enum:
            - GasExceeded
          type: string
        - description: Exceeded the maximum amount of gas allowed to burn per contract
          enum:
            - GasLimitExceeded
          type: string
        - description: Exceeded the account balance
          enum:
            - BalanceExceeded
          type: string
        - description: Tried to call an empty method name
          enum:
            - EmptyMethodName
          type: string
        - additionalProperties: false
          description: Smart contract panicked
          properties:
            GuestPanic:
              properties:
                panic_msg:
                  type: string
              required:
                - panic_msg
              type: object
          required:
            - GuestPanic
          type: object
        - description: IntegerOverflow happened during a contract execution
          enum:
            - IntegerOverflow
          type: string
        - additionalProperties: false
          description: '`promise_idx` does not correspond to existing promises'
          properties:
            InvalidPromiseIndex:
              properties:
                promise_idx:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - promise_idx
              type: object
          required:
            - InvalidPromiseIndex
          type: object
        - description: Actions can only be appended to non-joint promise.
          enum:
            - CannotAppendActionToJointPromise
          type: string
        - description: Returning joint promise is currently prohibited
          enum:
            - CannotReturnJointPromise
          type: string
        - additionalProperties: false
          description: Accessed invalid promise result index
          properties:
            InvalidPromiseResultIndex:
              properties:
                result_idx:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - result_idx
              type: object
          required:
            - InvalidPromiseResultIndex
          type: object
        - additionalProperties: false
          description: Accessed invalid register id
          properties:
            InvalidRegisterId:
              properties:
                register_id:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - register_id
              type: object
          required:
            - InvalidRegisterId
          type: object
        - additionalProperties: false
          description: >-
            Iterator `iterator_index` was invalidated after its creation by
            performing a mutable operation on trie
          properties:
            IteratorWasInvalidated:
              properties:
                iterator_index:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - iterator_index
              type: object
          required:
            - IteratorWasInvalidated
          type: object
        - description: Accessed memory outside the bounds
          enum:
            - MemoryAccessViolation
          type: string
        - additionalProperties: false
          description: VM Logic returned an invalid receipt index
          properties:
            InvalidReceiptIndex:
              properties:
                receipt_index:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - receipt_index
              type: object
          required:
            - InvalidReceiptIndex
          type: object
        - additionalProperties: false
          description: Iterator index `iterator_index` does not exist
          properties:
            InvalidIteratorIndex:
              properties:
                iterator_index:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - iterator_index
              type: object
          required:
            - InvalidIteratorIndex
          type: object
        - description: VM Logic returned an invalid account id
          enum:
            - InvalidAccountId
          type: string
        - description: VM Logic returned an invalid method name
          enum:
            - InvalidMethodName
          type: string
        - description: VM Logic provided an invalid public key
          enum:
            - InvalidPublicKey
          type: string
        - additionalProperties: false
          description: '`method_name` is not allowed in view calls'
          properties:
            ProhibitedInView:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - ProhibitedInView
          type: object
        - additionalProperties: false
          description: The total number of logs will exceed the limit.
          properties:
            NumberOfLogsExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - limit
              type: object
          required:
            - NumberOfLogsExceeded
          type: object
        - additionalProperties: false
          description: The storage key length exceeded the limit.
          properties:
            KeyLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - KeyLengthExceeded
          type: object
        - additionalProperties: false
          description: The storage value length exceeded the limit.
          properties:
            ValueLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - ValueLengthExceeded
          type: object
        - additionalProperties: false
          description: The total log length exceeded the limit.
          properties:
            TotalLogLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - TotalLogLengthExceeded
          type: object
        - additionalProperties: false
          description: >-
            The maximum number of promises within a FunctionCall exceeded the
            limit.
          properties:
            NumberPromisesExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_promises:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_promises
                - limit
              type: object
          required:
            - NumberPromisesExceeded
          type: object
        - additionalProperties: false
          description: The maximum number of input data dependencies exceeded the limit.
          properties:
            NumberInputDataDependenciesExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_input_data_dependencies:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_input_data_dependencies
                - limit
              type: object
          required:
            - NumberInputDataDependenciesExceeded
          type: object
        - additionalProperties: false
          description: The returned value length exceeded the limit.
          properties:
            ReturnedValueLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - ReturnedValueLengthExceeded
          type: object
        - additionalProperties: false
          description: The contract size for DeployContract action exceeded the limit.
          properties:
            ContractSizeExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                size:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - size
                - limit
              type: object
          required:
            - ContractSizeExceeded
          type: object
        - additionalProperties: false
          description: The host function was deprecated.
          properties:
            Deprecated:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - Deprecated
          type: object
        - additionalProperties: false
          description: General errors for ECDSA recover.
          properties:
            ECRecoverError:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - ECRecoverError
          type: object
        - additionalProperties: false
          description: >-
            Invalid input to alt_bn128 family of functions (e.g., point which
            isn't

            on the curve).
          properties:
            AltBn128InvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - AltBn128InvalidInput
          type: object
        - additionalProperties: false
          description: >-
            Invalid input to ed25519 signature verification function (e.g.
            signature cannot be

            derived from bytes).
          properties:
            Ed25519VerifyInvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - Ed25519VerifyInvalidInput
          type: object
        - additionalProperties: false
          description: >-
            Input length mismatch for p256 signature verification (signature is
            not 64

            bytes or public key is not 33 bytes). Parse failures of otherwise

            well-sized inputs return 0 from the host function instead of
            aborting.
          properties:
            P256VerifyInvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - P256VerifyInvalidInput
          type: object
        - additionalProperties: false
          description: >-
            Input length mismatch for ML-DSA-65 signature verification
            (signature is

            not 3309 bytes or public key is not 1952 bytes). Parse failures of

            otherwise well-sized inputs return 0 from the host function instead
            of

            aborting.
          properties:
            MlDsaVerifyInvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - MlDsaVerifyInvalidInput
          type: object
        - additionalProperties: false
          description: '`method_name` is not allowed in external contract calls'
          properties:
            ProhibitedInExternalCall:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - ProhibitedInExternalCall
          type: object
        - description: >-
            An external contract call has an attached deposit, which it cannot
            have
          enum:
            - DepositInExternalCall
          type: string
    PrepareError:
      description: Error that can occur while preparing or executing Wasm smart-contract.
      oneOf:
        - description: Error happened while serializing the module.
          enum:
            - Serialization
          type: string
        - description: Error happened while deserializing the module.
          enum:
            - Deserialization
          type: string
        - description: Internal memory declaration has been found in the module.
          enum:
            - InternalMemoryDeclared
          type: string
        - description: |-
            Gas instrumentation failed.

            This most likely indicates the module isn't valid.
          enum:
            - GasInstrumentation
          type: string
        - description: |-
            Stack instrumentation failed.

            This  most likely indicates the module isn't valid.
          enum:
            - StackHeightInstrumentation
          type: string
        - description: |-
            Error happened during instantiation.

            This might indicate that `start` function trapped, or module isn't
            instantiable and/or un-linkable.
          enum:
            - Instantiate
          type: string
        - description: Error creating memory.
          enum:
            - Memory
          type: string
        - description: Contract contains too many functions.
          enum:
            - TooManyFunctions
          type: string
        - description: Contract contains too many locals.
          enum:
            - TooManyLocals
          type: string
        - description: Contract contains too many tables.
          enum:
            - TooManyTables
          type: string
        - description: Contract contains too many table elements.
          enum:
            - TooManyTableElements
          type: string
        - description: A function body in the contract exceeds the size limit.
          enum:
            - FunctionBodyTooLarge
          type: string
        - description: The instrumented code exceeds the size limit.
          enum:
            - InstrumentedCodeTooLarge
          type: string
        - description: A function contains too many basic blocks.
          enum:
            - TooManyBlocksPerFunction
          type: string
        - description: A contract contains too many basic blocks.
          enum:
            - TooManyBlocksPerContract
          type: string
        - description: Contract declares too many entries in the wasm type section.
          enum:
            - TooManyTypes
          type: string
        - description: >-
            All contract functions combined have more than
            `max_params_per_contract` parameters.
          enum:
            - TooManyParamsPerFunction
          type: string
        - description: A function has more than `max_params_per_function` parameters.
          enum:
            - TooManyParamsPerContract
          type: string
        - description: |-
            A function's max operand-stack size (in bytes) exceeds
            `max_operand_stack_bytes_per_function`.
          enum:
            - OperandStackTooLarge
          type: string
        - description: Contract declares too many entries in the wasm global section.
          enum:
            - TooManyGlobals
          type: string

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.