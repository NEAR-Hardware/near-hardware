> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental view account

> Returns information about an account for given account_id.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_view_account
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_view_account:
    post:
      description: Returns information about an account for given account_id.
      operationId: EXPERIMENTAL_view_account
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_view_account
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcViewAccountResponse_and_RpcViewAccountError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_view_account:
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
            - EXPERIMENTAL_view_account
          type: string
        params:
          $ref: '#/components/schemas/RpcViewAccountRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_view_account
      type: object
    JsonRpcResponse_for_RpcViewAccountResponse_and_RpcViewAccountError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcViewAccountResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcViewAccountError'
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
      title: JsonRpcResponse_for_RpcViewAccountResponse_and_RpcViewAccountError
      type: object
    RpcViewAccountRequest:
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
      title: RpcViewAccountRequest
      type: object
    RpcViewAccountResponse:
      description: A view of the account
      properties:
        amount:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Liquid (non-staked) account balance, in yoctoNEAR.
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        block_height:
          format: uint64
          minimum: 0
          type: integer
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
        - block_height
        - block_hash
      type: object
    ErrorWrapper_for_RpcViewAccountError:
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
              $ref: '#/components/schemas/RpcViewAccountError'
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
    NearToken:
      type: string
    CryptoHash:
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
    RpcViewAccountError:
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