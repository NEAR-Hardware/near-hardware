> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental changes

> [Deprecated] Returns changes for a given account, contract or contract code for given block height or hash. Consider using changes instead.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_changes
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_changes:
    post:
      description: >-
        [Deprecated] Returns changes for a given account, contract or contract
        code for given block height or hash. Consider using changes instead.
      operationId: EXPERIMENTAL_changes
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_changes'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcStateChangesInBlockResponse_and_RpcStateChangesError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_changes:
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
            - EXPERIMENTAL_changes
          type: string
        params:
          $ref: '#/components/schemas/RpcStateChangesInBlockByTypeRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_changes
      type: object
    JsonRpcResponse_for_RpcStateChangesInBlockResponse_and_RpcStateChangesError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcStateChangesInBlockResponse'
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
        JsonRpcResponse_for_RpcStateChangesInBlockResponse_and_RpcStateChangesError
      type: object
    RpcStateChangesInBlockByTypeRequest:
      description: |-
        It is a [serializable view] of [`StateChangesRequest`].

        [serializable view]: ./index.html
        [`StateChangesRequest`]: ../types/struct.StateChangesRequest.html
      oneOf:
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - account_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: account_changes_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                changes_type:
                  enum:
                    - single_access_key_changes
                  type: string
                keys:
                  items:
                    $ref: '#/components/schemas/AccountWithPublicKey'
                  type: array
              required:
                - changes_type
                - keys
              type: object
          title: single_access_key_changes_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - all_access_key_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: all_access_key_changes_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - contract_code_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: contract_code_changes_by_block_id
        - allOf:
            - properties:
                block_id:
                  $ref: '#/components/schemas/BlockId'
              required:
                - block_id
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - data_changes
                  type: string
                key_prefix_base64:
                  $ref: '#/components/schemas/StoreKey'
              required:
                - changes_type
                - account_ids
                - key_prefix_base64
              type: object
          title: data_changes_by_block_id
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - account_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: account_changes_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                changes_type:
                  enum:
                    - single_access_key_changes
                  type: string
                keys:
                  items:
                    $ref: '#/components/schemas/AccountWithPublicKey'
                  type: array
              required:
                - changes_type
                - keys
              type: object
          title: single_access_key_changes_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - all_access_key_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: all_access_key_changes_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - contract_code_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: contract_code_changes_by_finality
        - allOf:
            - properties:
                finality:
                  $ref: '#/components/schemas/Finality'
              required:
                - finality
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - data_changes
                  type: string
                key_prefix_base64:
                  $ref: '#/components/schemas/StoreKey'
              required:
                - changes_type
                - account_ids
                - key_prefix_base64
              type: object
          title: data_changes_by_finality
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - account_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: account_changes_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                changes_type:
                  enum:
                    - single_access_key_changes
                  type: string
                keys:
                  items:
                    $ref: '#/components/schemas/AccountWithPublicKey'
                  type: array
              required:
                - changes_type
                - keys
              type: object
          title: single_access_key_changes_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - all_access_key_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: all_access_key_changes_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - contract_code_changes
                  type: string
              required:
                - changes_type
                - account_ids
              type: object
          title: contract_code_changes_by_sync_checkpoint
        - allOf:
            - properties:
                sync_checkpoint:
                  $ref: '#/components/schemas/SyncCheckpoint'
              required:
                - sync_checkpoint
              type: object
            - properties:
                account_ids:
                  items:
                    $ref: '#/components/schemas/AccountId'
                  type: array
                changes_type:
                  enum:
                    - data_changes
                  type: string
                key_prefix_base64:
                  $ref: '#/components/schemas/StoreKey'
              required:
                - changes_type
                - account_ids
                - key_prefix_base64
              type: object
          title: data_changes_by_sync_checkpoint
      title: RpcStateChangesInBlockByTypeRequest
      type: object
    RpcStateChangesInBlockResponse:
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        changes:
          items:
            $ref: '#/components/schemas/StateChangeWithCauseView'
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
    AccountWithPublicKey:
      description: Account ID with its public key.
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        public_key:
          $ref: '#/components/schemas/PublicKey'
      required:
        - account_id
        - public_key
      type: object
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
    StateChangeWithCauseView:
      oneOf:
        - properties:
            change:
              description: A view of the account
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                amount:
                  allOf:
                    - $ref: '#/components/schemas/NearToken'
                  description: Liquid (non-staked) account balance, in yoctoNEAR.
                bootstrap_nonce:
                  description: >-
                    The nonce an uninitialized account's own transactions must
                    use, present

                    only while it is uninitialized. A self-signed state init is
                    the one

                    transaction such an account can send, and this is the only
                    way for a

                    client to learn the nonce it must carry: there is no access
                    key to query.
                  format: uint64
                  minimum: 0
                  nullable: true
                  type: integer
                code_hash:
                  allOf:
                    - $ref: '#/components/schemas/CryptoHash'
                  description: >-
                    Hash of the deployed contract code; the all-`1`s hash when
                    no contract is deployed.
                global_contract_account_id:
                  anyOf:
                    - $ref: '#/components/schemas/AccountId'
                    - enum:
                        - null
                      nullable: true
                  description: >-
                    Set when the account uses a global contract referenced by
                    the deploying account id.
                global_contract_hash:
                  anyOf:
                    - $ref: '#/components/schemas/CryptoHash'
                    - enum:
                        - null
                      nullable: true
                  description: >-
                    Set when the account uses a global contract referenced by
                    code hash.
                locked:
                  allOf:
                    - $ref: '#/components/schemas/NearToken'
                  description: Staked balance locked for validation, in yoctoNEAR.
                state:
                  allOf:
                    - $ref: '#/components/schemas/AccountState'
                  description: >-
                    Whether the account is initialized. Only a universal account
                    can be

                    uninitialized: it has no access keys, code or data until a

                    `UniversalStateInit` arrives. Omitted for initialized
                    accounts.
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
                - account_id
                - amount
                - locked
                - code_hash
                - storage_usage
              type: object
            type:
              enum:
                - account_update
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
            type:
              enum:
                - account_deletion
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                access_key:
                  $ref: '#/components/schemas/AccessKeyView'
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKeyHandle'
              required:
                - account_id
                - public_key
                - access_key
              type: object
            type:
              enum:
                - access_key_update
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKeyHandle'
              required:
                - account_id
                - public_key
              type: object
            type:
              enum:
                - access_key_deletion
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                index:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
                nonce:
                  format: uint64
                  minimum: 0
                  type: integer
                public_key:
                  $ref: '#/components/schemas/PublicKeyHandle'
              required:
                - account_id
                - public_key
                - index
                - nonce
              type: object
            type:
              enum:
                - gas_key_nonce_update
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                key_base64:
                  $ref: '#/components/schemas/StoreKey'
                value_base64:
                  $ref: '#/components/schemas/StoreValue'
              required:
                - account_id
                - key_base64
                - value_base64
              type: object
            type:
              enum:
                - data_update
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                key_base64:
                  $ref: '#/components/schemas/StoreKey'
              required:
                - account_id
                - key_base64
              type: object
            type:
              enum:
                - data_deletion
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                code_base64:
                  type: string
              required:
                - account_id
                - code_base64
              type: object
            type:
              enum:
                - contract_code_update
              type: string
          required:
            - type
            - change
          type: object
        - properties:
            change:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
            type:
              enum:
                - contract_code_deletion
              type: string
          required:
            - type
            - change
          type: object
      properties:
        cause:
          $ref: '#/components/schemas/StateChangeCauseView'
      required:
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
    PublicKey:
      type: string
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
    PublicKeyHandle:
      type: string
    StoreValue:
      description: >-
        This type is used to mark values returned from store (arrays of bytes).


        NOTE: Currently, this type is only used in the view_client and RPC to be
        able to transparently

        pretty-serialize the bytes arrays as base64-encoded strings (see
        `serialize.rs`).
      format: bytes
      type: string
    StateChangeCauseView:
      description: See crate::types::StateChangeCause for details.
      oneOf:
        - properties:
            type:
              enum:
                - not_writable_to_disk
              type: string
          required:
            - type
          type: object
        - properties:
            type:
              enum:
                - initial_state
              type: string
          required:
            - type
          type: object
        - properties:
            tx_hash:
              $ref: '#/components/schemas/CryptoHash'
            type:
              enum:
                - transaction_processing
              type: string
          required:
            - type
            - tx_hash
          type: object
        - properties:
            receipt_hash:
              $ref: '#/components/schemas/CryptoHash'
            type:
              enum:
                - action_receipt_processing_started
              type: string
          required:
            - type
            - receipt_hash
          type: object
        - properties:
            receipt_hash:
              $ref: '#/components/schemas/CryptoHash'
            type:
              enum:
                - action_receipt_gas_reward
              type: string
          required:
            - type
            - receipt_hash
          type: object
        - properties:
            receipt_hash:
              $ref: '#/components/schemas/CryptoHash'
            type:
              enum:
                - receipt_processing
              type: string
          required:
            - type
            - receipt_hash
          type: object
        - properties:
            receipt_hash:
              $ref: '#/components/schemas/CryptoHash'
            type:
              enum:
                - postponed_receipt
              type: string
          required:
            - type
            - receipt_hash
          type: object
        - properties:
            type:
              enum:
                - updated_delayed_receipts
              type: string
          required:
            - type
          type: object
        - properties:
            type:
              enum:
                - validator_accounts_update
              type: string
          required:
            - type
          type: object
        - properties:
            type:
              enum:
                - migration
              type: string
          required:
            - type
          type: object
        - properties:
            type:
              enum:
                - bandwidth_scheduler_state_update
              type: string
          required:
            - type
          type: object
        - properties:
            type:
              enum:
                - contract_compilation_status_update
              type: string
          required:
            - type
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.