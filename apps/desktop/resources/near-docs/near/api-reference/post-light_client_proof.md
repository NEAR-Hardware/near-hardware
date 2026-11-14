> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post light client proof

> Returns the proofs for a transaction execution.



## OpenAPI

````yaml /openapi.json post /light_client_proof
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /light_client_proof:
    post:
      description: Returns the proofs for a transaction execution.
      operationId: light_client_proof
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_light_client_proof'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcLightClientExecutionProofResponse_and_RpcLightClientProofError
components:
  schemas:
    JsonRpcRequest_for_light_client_proof:
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
            - light_client_proof
          type: string
        params:
          $ref: '#/components/schemas/RpcLightClientExecutionProofRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_light_client_proof
      type: object
    JsonRpcResponse_for_RpcLightClientExecutionProofResponse_and_RpcLightClientProofError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcLightClientExecutionProofResponse'
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
        JsonRpcResponse_for_RpcLightClientExecutionProofResponse_and_RpcLightClientProofError
      type: object
    RpcLightClientExecutionProofRequest:
      oneOf:
        - properties:
            sender_id:
              $ref: '#/components/schemas/AccountId'
            transaction_hash:
              $ref: '#/components/schemas/CryptoHash'
            type:
              enum:
                - transaction
              type: string
          required:
            - type
            - transaction_hash
            - sender_id
          type: object
        - properties:
            receipt_id:
              $ref: '#/components/schemas/CryptoHash'
            receiver_id:
              $ref: '#/components/schemas/AccountId'
            type:
              enum:
                - receipt
              type: string
          required:
            - type
            - receipt_id
            - receiver_id
          type: object
      properties:
        light_client_head:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - light_client_head
      title: RpcLightClientExecutionProofRequest
      type: object
    RpcLightClientExecutionProofResponse:
      properties:
        block_header_lite:
          $ref: '#/components/schemas/LightClientBlockLiteView'
        block_proof:
          items:
            $ref: '#/components/schemas/MerklePathItem'
          type: array
        outcome_proof:
          $ref: '#/components/schemas/ExecutionOutcomeWithIdView'
        outcome_root_proof:
          items:
            $ref: '#/components/schemas/MerklePathItem'
          type: array
      required:
        - outcome_proof
        - outcome_root_proof
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
    ExecutionOutcomeWithIdView:
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        id:
          $ref: '#/components/schemas/CryptoHash'
        outcome:
          $ref: '#/components/schemas/ExecutionOutcomeView'
        proof:
          items:
            $ref: '#/components/schemas/MerklePathItem'
          type: array
      required:
        - proof
        - block_hash
        - id
        - outcome
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
    ExecutionOutcomeView:
      properties:
        executor_id:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: >-
            The id of the account on which the execution happens. For
            transaction this is signer_id,

            for receipt this is receiver_id.
        gas_burnt:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: The amount of the gas burnt by the given transaction or receipt.
        logs:
          description: Logs from this transaction or receipt.
          items:
            type: string
          type: array
        metadata:
          allOf:
            - $ref: '#/components/schemas/ExecutionMetadataView'
          default:
            version: 1
          description: Execution metadata, versioned
        receipt_ids:
          description: Receipt IDs generated by this transaction or receipt.
          items:
            $ref: '#/components/schemas/CryptoHash'
          type: array
        status:
          allOf:
            - $ref: '#/components/schemas/ExecutionStatusView'
          description: >-
            Execution status. Contains the result in case of successful
            execution.
        tokens_burnt:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: >-
            The amount of tokens burnt corresponding to the burnt gas amount.

            This value doesn't always equal to the `gas_burnt` multiplied by the
            gas price, because

            the prepaid gas price might be lower than the actual gas price and
            it creates a deficit.

            `tokens_burnt` also contains the penalty subtracted from refunds,
            while

            `gas_burnt` only contains the gas that we actually burn for the
            execution.
      required:
        - logs
        - receipt_ids
        - gas_burnt
        - tokens_burnt
        - executor_id
        - status
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
    NearGas:
      format: uint64
      minimum: 0
      type: integer
    ExecutionMetadataView:
      properties:
        contracts:
          description: >-
            One entry per action in the receipt (V4+ only): the contract
            attached

            to the receiver account immediately before that action ran. The
            inner

            `Option` is `Some` (a tagged contract object) when the account had a

            contract and `None` (rendered as JSON `null`) when it did not (e.g.
            an

            account with no code, or one that did not yet exist). The outer

            `Option` is `None` for older metadata versions.
          items:
            anyOf:
              - $ref: '#/components/schemas/AccountContractView'
              - enum:
                  - null
                nullable: true
          nullable: true
          type: array
        gas_profile:
          items:
            $ref: '#/components/schemas/CostGasUsed'
          nullable: true
          type: array
        version:
          format: uint32
          minimum: 0
          type: integer
      required:
        - version
      type: object
    ExecutionStatusView:
      oneOf:
        - description: The execution is pending or unknown.
          enum:
            - Unknown
          type: string
        - additionalProperties: false
          description: The execution has failed.
          properties:
            Failure:
              $ref: '#/components/schemas/TxExecutionError'
          required:
            - Failure
          type: object
        - additionalProperties: false
          description: >-
            The final action succeeded and returned some value or an empty vec
            encoded in base64.
          properties:
            SuccessValue:
              type: string
          required:
            - SuccessValue
          type: object
        - additionalProperties: false
          description: >-
            The final action of the receipt returned a promise or the signed
            transaction was converted

            to a receipt. Contains the receipt_id of the generated receipt.
          properties:
            SuccessReceiptId:
              $ref: '#/components/schemas/CryptoHash'
          required:
            - SuccessReceiptId
          type: object
    NearToken:
      type: string
    AccountContractView:
      description: |-
        RPC view of a non-empty [`AccountContract`]. The `AccountContract::None`
        variant is represented externally as a JSON `null` via `Option`, so this
        enum only carries the three "contract is present" cases. Serializes as
        an externally-tagged object:

        - `Local(hash)` → `{"local": "<CryptoHash>"}`
        - `GlobalHash(hash)` → `{"global_hash": "<CryptoHash>"}`
        - `GlobalAccountId(id)` → `{"global_account_id": "<AccountId>"}`

        Mirrors [`AccountContract`] 1:1 (minus `None`) so consumers can preserve
        the distinction between a global-by-hash and global-by-account contract
        without descending into a nested identifier.
      oneOf:
        - additionalProperties: false
          properties:
            local:
              $ref: '#/components/schemas/CryptoHash'
          required:
            - local
          type: object
        - additionalProperties: false
          properties:
            global_hash:
              $ref: '#/components/schemas/CryptoHash'
          required:
            - global_hash
          type: object
        - additionalProperties: false
          properties:
            global_account_id:
              $ref: '#/components/schemas/AccountId'
          required:
            - global_account_id
          type: object
    CostGasUsed:
      description: >-
        Shows gas profile. More info
        [here](https://near.github.io/nearcore/architecture/gas/gas_profile.html?highlight=WASM_HOST_COST#example-transaction-gas-profile).
      properties:
        cost:
          type: string
        cost_category:
          description: Either ACTION_COST or WASM_HOST_COST.
          type: string
        gas_used:
          type: string
      required:
        - cost_category
        - cost
        - gas_used
      type: object
    TxExecutionError:
      description: Error returned in the ExecutionOutcome in case of failure
      oneOf:
        - additionalProperties: false
          description: An error happened during Action execution
          properties:
            ActionError:
              $ref: '#/components/schemas/ActionError'
          required:
            - ActionError
          type: object
        - additionalProperties: false
          description: An error happened during Transaction execution
          properties:
            InvalidTxError:
              $ref: '#/components/schemas/InvalidTxError'
          required:
            - InvalidTxError
          type: object
    ActionError:
      description: An error happened during Action execution
      properties:
        index:
          description: >-
            Index of the failed action in the transaction.

            Action index is not defined if ActionError.kind is
            `ActionErrorKind::LackBalanceForState`
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        kind:
          allOf:
            - $ref: '#/components/schemas/ActionErrorKind'
          description: The kind of ActionError happened
      required:
        - kind
      type: object
    InvalidTxError:
      description: An error happened during TX execution
      oneOf:
        - additionalProperties: false
          description: >-
            Happens if a wrong AccessKey used or AccessKey has not enough
            permissions
          properties:
            InvalidAccessKeyError:
              $ref: '#/components/schemas/InvalidAccessKeyError'
          required:
            - InvalidAccessKeyError
          type: object
        - additionalProperties: false
          description: TX signer_id is not a valid [`AccountId`]
          properties:
            InvalidSignerId:
              properties:
                signer_id:
                  type: string
              required:
                - signer_id
              type: object
          required:
            - InvalidSignerId
          type: object
        - additionalProperties: false
          description: TX signer_id is not found in a storage
          properties:
            SignerDoesNotExist:
              properties:
                signer_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - signer_id
              type: object
          required:
            - SignerDoesNotExist
          type: object
        - additionalProperties: false
          description: >-
            Transaction nonce must be strictly greater than
            `account[access_key].nonce`.
          properties:
            InvalidNonce:
              properties:
                ak_nonce:
                  format: uint64
                  minimum: 0
                  type: integer
                tx_nonce:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - tx_nonce
                - ak_nonce
              type: object
          required:
            - InvalidNonce
          type: object
        - additionalProperties: false
          description: >-
            Transaction nonce is larger than the upper bound given by the block
            height
          properties:
            NonceTooLarge:
              properties:
                tx_nonce:
                  format: uint64
                  minimum: 0
                  type: integer
                upper_bound:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - tx_nonce
                - upper_bound
              type: object
          required:
            - NonceTooLarge
          type: object
        - additionalProperties: false
          description: TX receiver_id is not a valid AccountId
          properties:
            InvalidReceiverId:
              properties:
                receiver_id:
                  type: string
              required:
                - receiver_id
              type: object
          required:
            - InvalidReceiverId
          type: object
        - description: TX signature is not valid
          enum:
            - InvalidSignature
          type: string
        - additionalProperties: false
          description: Account does not have enough balance to cover TX cost
          properties:
            NotEnoughBalance:
              properties:
                balance:
                  $ref: '#/components/schemas/NearToken'
                cost:
                  $ref: '#/components/schemas/NearToken'
                signer_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - signer_id
                - balance
                - cost
              type: object
          required:
            - NotEnoughBalance
          type: object
        - additionalProperties: false
          description: Signer account doesn't have enough balance after transaction.
          properties:
            LackBalanceForState:
              properties:
                amount:
                  allOf:
                    - $ref: '#/components/schemas/NearToken'
                  description: Required balance to cover the state.
                signer_id:
                  allOf:
                    - $ref: '#/components/schemas/AccountId'
                  description: >-
                    An account which doesn't have enough balance to cover
                    storage.
              required:
                - signer_id
                - amount
              type: object
          required:
            - LackBalanceForState
          type: object
        - description: An integer overflow occurred during transaction cost estimation.
          enum:
            - CostOverflow
          type: string
        - description: Transaction parent block hash doesn't belong to the current chain
          enum:
            - InvalidChain
          type: string
        - description: Transaction has expired
          enum:
            - Expired
          type: string
        - additionalProperties: false
          description: An error occurred while validating actions of a Transaction.
          properties:
            ActionsValidation:
              $ref: '#/components/schemas/ActionsValidationError'
          required:
            - ActionsValidation
          type: object
        - additionalProperties: false
          description: The size of serialized transaction exceeded the limit.
          properties:
            TransactionSizeExceeded:
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
            - TransactionSizeExceeded
          type: object
        - description: Transaction version is invalid.
          enum:
            - InvalidTransactionVersion
          type: string
        - additionalProperties: false
          properties:
            StorageError:
              $ref: '#/components/schemas/StorageError'
          required:
            - StorageError
          type: object
        - additionalProperties: false
          description: |-
            The receiver shard of the transaction is too congested to accept new
            transactions at the moment.
          properties:
            ShardCongested:
              properties:
                congestion_level:
                  description: A value between 0 (no congestion) and 1 (max congestion).
                  format: double
                  type: number
                shard_id:
                  description: The congested shard.
                  format: uint32
                  minimum: 0
                  type: integer
              required:
                - shard_id
                - congestion_level
              type: object
          required:
            - ShardCongested
          type: object
        - additionalProperties: false
          description: >-
            The receiver shard of the transaction missed several chunks and
            rejects

            new transaction until it can make progress again.
          properties:
            ShardStuck:
              properties:
                missed_chunks:
                  description: >-
                    The number of blocks since the last included chunk of the
                    shard.
                  format: uint64
                  minimum: 0
                  type: integer
                shard_id:
                  description: The shard that fails making progress.
                  format: uint32
                  minimum: 0
                  type: integer
              required:
                - shard_id
                - missed_chunks
              type: object
          required:
            - ShardStuck
          type: object
        - additionalProperties: false
          description: >-
            Transaction is specifying an invalid nonce index. Gas key
            transactions

            must have a nonce_index in valid range, regular transactions must
            not.
          properties:
            InvalidNonceIndex:
              properties:
                num_nonces:
                  description: >-
                    Number of nonces supported by the key. 0 means no
                    nonce_index allowed (regular key).
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
                tx_nonce_index:
                  description: The nonce_index from the transaction (None if missing).
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  nullable: true
                  type: integer
              required:
                - num_nonces
              type: object
          required:
            - InvalidNonceIndex
          type: object
        - additionalProperties: false
          description: Gas key does not have enough balance to cover gas costs.
          properties:
            NotEnoughGasKeyBalance:
              properties:
                balance:
                  $ref: '#/components/schemas/NearToken'
                cost:
                  $ref: '#/components/schemas/NearToken'
                signer_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - signer_id
                - balance
                - cost
              type: object
          required:
            - NotEnoughGasKeyBalance
          type: object
        - additionalProperties: false
          description: >-
            Gas key transaction failed because the account could not cover the
            deposit cost.

            Gas is still charged from the gas key in this case.
          properties:
            NotEnoughBalanceForDeposit:
              properties:
                balance:
                  $ref: '#/components/schemas/NearToken'
                cost:
                  $ref: '#/components/schemas/NearToken'
                reason:
                  $ref: '#/components/schemas/DepositCostFailureReason'
                signer_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - signer_id
                - balance
                - cost
                - reason
              type: object
          required:
            - NotEnoughBalanceForDeposit
          type: object
        - additionalProperties: false
          description: >-
            The target of an external contract call has no contract, or no
            account.
          properties:
            ContractNotFound:
              properties:
                contract_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - contract_id
              type: object
          required:
            - ContractNotFound
          type: object
    ActionErrorKind:
      oneOf:
        - additionalProperties: false
          description: >-
            Happens when CreateAccount action tries to create an account with
            account_id which is already exists in the storage
          properties:
            AccountAlreadyExists:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - AccountAlreadyExists
          type: object
        - additionalProperties: false
          description: >-
            Happens when TX receiver_id doesn't exist (but action is not
            Action::CreateAccount)
          properties:
            AccountDoesNotExist:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - AccountDoesNotExist
          type: object
        - additionalProperties: false
          description: A top-level account ID can only be created by registrar.
          properties:
            CreateAccountOnlyByRegistrar:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                predecessor_id:
                  $ref: '#/components/schemas/AccountId'
                registrar_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
                - registrar_account_id
                - predecessor_id
              type: object
          required:
            - CreateAccountOnlyByRegistrar
          type: object
        - additionalProperties: false
          description: >-
            A newly created account must be under a namespace of the creator
            account
          properties:
            CreateAccountNotAllowed:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                predecessor_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
                - predecessor_id
              type: object
          required:
            - CreateAccountNotAllowed
          type: object
        - additionalProperties: false
          description: >-
            Administrative actions like `DeployContract`, `Stake`, `AddKey`,
            `DeleteKey`. can be proceed only if sender=receiver

            or the first TX action is a `CreateAccount` action
          properties:
            ActorNoPermission:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                actor_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
                - actor_id
              type: object
          required:
            - ActorNoPermission
          type: object
        - additionalProperties: false
          description: Account tries to remove an access key that doesn't exist
          properties:
            DeleteKeyDoesNotExist:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - account_id
                - public_key
              type: object
          required:
            - DeleteKeyDoesNotExist
          type: object
        - additionalProperties: false
          description: The public key is already used for an existing access key
          properties:
            AddKeyAlreadyExists:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - account_id
                - public_key
              type: object
          required:
            - AddKeyAlreadyExists
          type: object
        - additionalProperties: false
          description: Account is staking and can not be deleted
          properties:
            DeleteAccountStaking:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - DeleteAccountStaking
          type: object
        - additionalProperties: false
          description: >-
            ActionReceipt can't be completed, because the remaining balance will
            not be enough to cover storage.
          properties:
            LackBalanceForState:
              properties:
                account_id:
                  allOf:
                    - $ref: '#/components/schemas/AccountId'
                  description: An account which needs balance
                amount:
                  allOf:
                    - $ref: '#/components/schemas/NearToken'
                  description: Balance required to complete an action.
              required:
                - account_id
                - amount
              type: object
          required:
            - LackBalanceForState
          type: object
        - additionalProperties: false
          description: Account is not yet staked, but tries to unstake
          properties:
            TriesToUnstake:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - TriesToUnstake
          type: object
        - additionalProperties: false
          description: The account doesn't have enough balance to increase the stake.
          properties:
            TriesToStake:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                balance:
                  $ref: '#/components/schemas/NearToken'
                locked:
                  $ref: '#/components/schemas/NearToken'
                stake:
                  $ref: '#/components/schemas/NearToken'
              required:
                - account_id
                - stake
                - locked
                - balance
              type: object
          required:
            - TriesToStake
          type: object
        - additionalProperties: false
          properties:
            InsufficientStake:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                minimum_stake:
                  $ref: '#/components/schemas/NearToken'
                stake:
                  $ref: '#/components/schemas/NearToken'
              required:
                - account_id
                - stake
                - minimum_stake
              type: object
          required:
            - InsufficientStake
          type: object
        - additionalProperties: false
          description: >-
            An error occurred during a `FunctionCall` Action, parameter is debug
            message.
          properties:
            FunctionCallError:
              $ref: '#/components/schemas/FunctionCallError'
          required:
            - FunctionCallError
          type: object
        - additionalProperties: false
          description: >-
            Error occurs when a new `ActionReceipt` created by the
            `FunctionCall` action fails

            receipt validation.
          properties:
            NewReceiptValidationError:
              $ref: '#/components/schemas/ReceiptValidationError'
          required:
            - NewReceiptValidationError
          type: object
        - additionalProperties: false
          description: >-
            Error occurs when a `CreateAccount` action is called on a
            NEAR-implicit or ETH-implicit account.

            See NEAR-implicit account creation NEP:
            <https://github.com/nearprotocol/NEPs/pull/71>.

            Also, see ETH-implicit account creation NEP:
            <https://github.com/near/NEPs/issues/518>.


            TODO(#8598): This error is named very poorly. A better name would be

            `OnlyNamedAccountCreationAllowed`.
          properties:
            OnlyImplicitAccountCreationAllowed:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - OnlyImplicitAccountCreationAllowed
          type: object
        - additionalProperties: false
          description: Delete account whose state is large is temporarily banned.
          properties:
            DeleteAccountWithLargeState:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - DeleteAccountWithLargeState
          type: object
        - description: >-
            Signature does not match the provided actions and given signer
            public key.
          enum:
            - DelegateActionInvalidSignature
          type: string
        - additionalProperties: false
          description: >-
            Receiver of the transaction doesn't match Sender of the delegate
            action
          properties:
            DelegateActionSenderDoesNotMatchTxReceiver:
              properties:
                receiver_id:
                  $ref: '#/components/schemas/AccountId'
                sender_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - sender_id
                - receiver_id
              type: object
          required:
            - DelegateActionSenderDoesNotMatchTxReceiver
          type: object
        - description: >-
            Delegate action has expired. `max_block_height` is less than actual
            block height.
          enum:
            - DelegateActionExpired
          type: string
        - additionalProperties: false
          description: The given public key doesn't exist for Sender account
          properties:
            DelegateActionAccessKeyError:
              $ref: '#/components/schemas/InvalidAccessKeyError'
          required:
            - DelegateActionAccessKeyError
          type: object
        - additionalProperties: false
          description: DelegateAction nonce must be greater sender[public_key].nonce
          properties:
            DelegateActionInvalidNonce:
              properties:
                ak_nonce:
                  format: uint64
                  minimum: 0
                  type: integer
                delegate_nonce:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - delegate_nonce
                - ak_nonce
              type: object
          required:
            - DelegateActionInvalidNonce
          type: object
        - additionalProperties: false
          description: >-
            DelegateAction nonce is larger than the upper bound given by the
            block height
          properties:
            DelegateActionNonceTooLarge:
              properties:
                delegate_nonce:
                  format: uint64
                  minimum: 0
                  type: integer
                upper_bound:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - delegate_nonce
                - upper_bound
              type: object
          required:
            - DelegateActionNonceTooLarge
          type: object
        - additionalProperties: false
          properties:
            GlobalContractDoesNotExist:
              properties:
                identifier:
                  $ref: '#/components/schemas/GlobalContractIdentifier'
              required:
                - identifier
              type: object
          required:
            - GlobalContractDoesNotExist
          type: object
        - additionalProperties: false
          description: Gas key does not exist for the specified public key
          properties:
            GasKeyDoesNotExist:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - account_id
                - public_key
              type: object
          required:
            - GasKeyDoesNotExist
          type: object
        - additionalProperties: false
          description: >-
            Gas key does not have sufficient balance for the requested
            withdrawal
          properties:
            InsufficientGasKeyBalance:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                balance:
                  $ref: '#/components/schemas/NearToken'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                required:
                  $ref: '#/components/schemas/NearToken'
              required:
                - account_id
                - public_key
                - balance
                - required
              type: object
          required:
            - InsufficientGasKeyBalance
          type: object
        - additionalProperties: false
          description: Gas key balance is too high to burn during deletion
          properties:
            GasKeyBalanceTooHigh:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                balance:
                  $ref: '#/components/schemas/NearToken'
                public_key:
                  anyOf:
                    - $ref: '#/components/schemas/PublicKey'
                    - enum:
                        - null
                      nullable: true
                  description: >-
                    Set for DeleteKey (specific key), None for DeleteAccount
                    (aggregate)
              required:
                - account_id
                - balance
              type: object
          required:
            - GasKeyBalanceTooHigh
          type: object
        - additionalProperties: false
          description: DelegateAction nonce index is outside the gas key's nonce range
          properties:
            DelegateActionInvalidNonceIndex:
              properties:
                nonce_index:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
                num_nonces:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
              required:
                - nonce_index
                - num_nonces
              type: object
          required:
            - DelegateActionInvalidNonceIndex
          type: object
        - additionalProperties: false
          description: |-
            The combined size of the resolved promise inputs (the `DataReceipt`s
            referenced by the receipt's `input_data_ids`) exceeded the limit.
          properties:
            TotalPromiseInputSizeExceeded:
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
            - TotalPromiseInputSizeExceeded
          type: object
        - additionalProperties: false
          description: |-
            The receipt recorded more storage proof than
            `per_receipt_storage_proof_size_limit` allows.
          properties:
            ReceiptStorageProofSizeExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - limit
              type: object
          required:
            - ReceiptStorageProofSizeExceeded
          type: object
        - description: >-
            The bytes of a `UniversalStateInit` action are not the canonical
            borsh of a

            state init. Action validation rejects such an action before it runs,
            so this

            only fires if that check was bypassed.
          enum:
            - MalformedUniversalStateInit
          type: string
        - additionalProperties: false
          description: >-
            The action needs a set-up account, but the receiver is an
            uninitialized

            universal account. Distinct from `AccountDoesNotExist`: the account
            is

            there, it just has no access keys, code or data yet.
          properties:
            AccountNotInitialized:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - AccountNotInitialized
          type: object
        - additionalProperties: false
          description: >-
            A `FunctionCall` action called the method reserved for external
            contract calls.

            That method only runs in an external call or a view call.
          properties:
            ReservedMethodName:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - ReservedMethodName
          type: object
    InvalidAccessKeyError:
      oneOf:
        - additionalProperties: false
          description: >-
            The access key identified by the `public_key` doesn't exist for the
            account
          properties:
            AccessKeyNotFound:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - account_id
                - public_key
              type: object
          required:
            - AccessKeyNotFound
          type: object
        - additionalProperties: false
          description: Transaction `receiver_id` doesn't match the access key receiver_id
          properties:
            ReceiverMismatch:
              properties:
                ak_receiver:
                  type: string
                tx_receiver:
                  $ref: '#/components/schemas/AccountId'
              required:
                - tx_receiver
                - ak_receiver
              type: object
          required:
            - ReceiverMismatch
          type: object
        - additionalProperties: false
          description: Transaction method name isn't allowed by the access key
          properties:
            MethodNameMismatch:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - MethodNameMismatch
          type: object
        - description: Transaction requires a full permission access key.
          enum:
            - RequiresFullAccess
          type: string
        - additionalProperties: false
          description: Access Key does not have enough allowance to cover transaction cost
          properties:
            NotEnoughAllowance:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
                allowance:
                  $ref: '#/components/schemas/NearToken'
                cost:
                  $ref: '#/components/schemas/NearToken'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - account_id
                - public_key
                - allowance
                - cost
              type: object
          required:
            - NotEnoughAllowance
          type: object
        - description: >-
            Having a deposit with a function call action is not allowed with a
            function call access key.
          enum:
            - DepositWithFunctionCall
          type: string
        - description: >-
            A plain access key nonce does not select one of the gas key's
            nonces.

            `DelegateV2` was intended to carry a gas key nonce, however gas key

            meta transactions are disabled. See
            `ProtocolFeature::RejectDelegateV2`.
          enum:
            - DelegateActionRequiresNonGasKey
          type: string
        - description: A delegate action with a gas key nonce must be signed by a gas key.
          enum:
            - DelegateActionRequiresGasKey
          type: string
    ActionsValidationError:
      description: Describes the error for validating a list of actions.
      oneOf:
        - description: The delete action must be a final action in transaction
          enum:
            - DeleteActionMustBeFinal
          type: string
        - additionalProperties: false
          description: The total prepaid gas (for all given actions) exceeded the limit.
          properties:
            TotalPrepaidGasExceeded:
              properties:
                limit:
                  $ref: '#/components/schemas/NearGas'
                total_prepaid_gas:
                  $ref: '#/components/schemas/NearGas'
              required:
                - total_prepaid_gas
                - limit
              type: object
          required:
            - TotalPrepaidGasExceeded
          type: object
        - additionalProperties: false
          description: The number of actions exceeded the given limit.
          properties:
            TotalNumberOfActionsExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                total_number_of_actions:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - total_number_of_actions
                - limit
              type: object
          required:
            - TotalNumberOfActionsExceeded
          type: object
        - additionalProperties: false
          description: >-
            The total number of bytes of the method names exceeded the limit in
            a Add Key action.
          properties:
            AddKeyMethodNamesNumberOfBytesExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                total_number_of_bytes:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - total_number_of_bytes
                - limit
              type: object
          required:
            - AddKeyMethodNamesNumberOfBytesExceeded
          type: object
        - additionalProperties: false
          description: >-
            The length of some method name exceeded the limit in a Add Key
            action.
          properties:
            AddKeyMethodNameLengthExceeded:
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
            - AddKeyMethodNameLengthExceeded
          type: object
        - description: Integer overflow during a compute.
          enum:
            - IntegerOverflow
          type: string
        - additionalProperties: false
          description: Invalid account ID.
          properties:
            InvalidAccountId:
              properties:
                account_id:
                  type: string
              required:
                - account_id
              type: object
          required:
            - InvalidAccountId
          type: object
        - additionalProperties: false
          description: >-
            The size of the contract code exceeded the limit in a DeployContract
            action.
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
          description: >-
            The length of the method name exceeded the limit in a Function Call
            action.
          properties:
            FunctionCallMethodNameLengthExceeded:
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
            - FunctionCallMethodNameLengthExceeded
          type: object
        - additionalProperties: false
          description: >-
            The length of the arguments exceeded the limit in a Function Call
            action.
          properties:
            FunctionCallArgumentsLengthExceeded:
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
            - FunctionCallArgumentsLengthExceeded
          type: object
        - additionalProperties: false
          description: >-
            An attempt to stake with a public key that is not convertible to
            ristretto.
          properties:
            UnsuitableStakingKey:
              properties:
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
              type: object
          required:
            - UnsuitableStakingKey
          type: object
        - description: >-
            The attached amount of gas in a FunctionCall action has to be a
            positive number.
          enum:
            - FunctionCallZeroAttachedGas
          type: string
        - description: There should be the only one DelegateAction
          enum:
            - DelegateActionMustBeOnlyOne
          type: string
        - additionalProperties: false
          description: >-
            The transaction includes a feature that the current protocol version

            does not support.


            Note: we stringify the protocol feature name instead of using

            `ProtocolFeature` here because we don't want to leak the internals
            of

            that type into observable borsh serialization.
          properties:
            UnsupportedProtocolFeature:
              properties:
                protocol_feature:
                  type: string
                version:
                  format: uint32
                  minimum: 0
                  type: integer
              required:
                - protocol_feature
                - version
              type: object
          required:
            - UnsupportedProtocolFeature
          type: object
        - additionalProperties: false
          properties:
            InvalidDeterministicStateInitReceiver:
              properties:
                derived_id:
                  $ref: '#/components/schemas/AccountId'
                receiver_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - receiver_id
                - derived_id
              type: object
          required:
            - InvalidDeterministicStateInitReceiver
          type: object
        - additionalProperties: false
          properties:
            DeterministicStateInitKeyLengthExceeded:
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
            - DeterministicStateInitKeyLengthExceeded
          type: object
        - additionalProperties: false
          properties:
            DeterministicStateInitValueLengthExceeded:
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
            - DeterministicStateInitValueLengthExceeded
          type: object
        - additionalProperties: false
          properties:
            GasKeyInvalidNumNonces:
              properties:
                limit:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
                requested_nonces:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
              required:
                - requested_nonces
                - limit
              type: object
          required:
            - GasKeyInvalidNumNonces
          type: object
        - additionalProperties: false
          properties:
            AddGasKeyWithNonZeroBalance:
              properties:
                balance:
                  $ref: '#/components/schemas/NearToken'
              required:
                - balance
              type: object
          required:
            - AddGasKeyWithNonZeroBalance
          type: object
        - description: Gas keys with FunctionCall permission cannot have an allowance set.
          enum:
            - GasKeyFunctionCallAllowanceNotAllowed
          type: string
        - additionalProperties: false
          description: |-
            The combined number of `DeployContract` and `DeployGlobalContract`
            actions in one receipt exceeded the limit.
          properties:
            TotalNumberOfDeployActionsExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_deploy_actions:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_deploy_actions
                - limit
              type: object
          required:
            - TotalNumberOfDeployActionsExceeded
          type: object
        - description: The method name in a FunctionCall action must not be empty.
          enum:
            - FunctionCallEmptyMethodName
          type: string
        - additionalProperties: false
          description: >-
            The receiver id of a `UniversalStateInit` action does not match the
            id

            derived from its state init.
          properties:
            InvalidUniversalStateInitReceiver:
              properties:
                derived_id:
                  $ref: '#/components/schemas/AccountId'
                receiver_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - receiver_id
                - derived_id
              type: object
          required:
            - InvalidUniversalStateInitReceiver
          type: object
        - additionalProperties: false
          description: >-
            A storage key in a `UniversalStateInit` state init exceeds the
            limit.
          properties:
            UniversalStateInitKeyLengthExceeded:
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
            - UniversalStateInitKeyLengthExceeded
          type: object
        - additionalProperties: false
          description: >-
            A storage value in a `UniversalStateInit` state init exceeds the
            limit.
          properties:
            UniversalStateInitValueLengthExceeded:
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
            - UniversalStateInitValueLengthExceeded
          type: object
        - description: >-
            The bytes in `RawStateInit` do not decode into `UniversalStateInit`,
            or they are not the

            canonical representation of the struct.
          enum:
            - MalformedUniversalStateInit
          type: string
        - additionalProperties: false
          description: >-
            The transaction includes a feature that was removed at or before the

            current protocol version. The counterpart of

            `UnsupportedProtocolFeature`, which covers features not yet
            available.
          properties:
            RemovedProtocolFeature:
              properties:
                protocol_feature:
                  type: string
                version:
                  format: uint32
                  minimum: 0
                  type: integer
              required:
                - protocol_feature
                - version
              type: object
          required:
            - RemovedProtocolFeature
          type: object
        - description: >-
            A `WithdrawFromGasKey` action must not be nested inside a delegate
            action.
          enum:
            - WithdrawFromGasKeyNotAllowedInDelegate
          type: string
        - additionalProperties: false
          description: >-
            The state-init actions in one receipt commit to more access keys in
            total

            than allowed.
          properties:
            TotalNumberOfStateInitKeysExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_keys:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_keys
                - limit
              type: object
          required:
            - TotalNumberOfStateInitKeysExceeded
          type: object
        - additionalProperties: false
          description: >-
            The state-init actions in one receipt carry more storage entries in
            total

            than allowed.
          properties:
            TotalNumberOfStateInitEntriesExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_entries:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_entries
                - limit
              type: object
          required:
            - TotalNumberOfStateInitEntriesExceeded
          type: object
        - additionalProperties: false
          description: >-
            A transfer to a universal account while transfers to them are
            banned.
          properties:
            TransferToUniversalAccountNotAllowed:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - TransferToUniversalAccountNotAllowed
          type: object
    StorageError:
      description: |-
        Errors which may occur during working with trie storages, storing
        trie values (trie nodes and state values) by their hashes.
      oneOf:
        - description: Key-value db internal failure
          enum:
            - StorageInternalError
          type: string
        - additionalProperties: false
          description: Requested trie value by its hash which is missing in storage.
          properties:
            MissingTrieValue:
              $ref: '#/components/schemas/MissingTrieValue'
          required:
            - MissingTrieValue
          type: object
        - description: |-
            Found trie node which shouldn't be part of state. Raised during
            validation of state sync parts where incorrect node was passed.
            TODO (#8997): consider including hash of trie node.
          enum:
            - UnexpectedTrieValue
          type: string
        - additionalProperties: false
          description: >-
            Either invalid state or key-value db is corrupted.

            For PartialStorage it cannot be corrupted.

            Error message is unreliable and for debugging purposes only. It's
            also probably ok to

            panic in every place that produces this error.

            We can check if db is corrupted by verifying everything in the state
            trie.
          properties:
            StorageInconsistentState:
              type: string
          required:
            - StorageInconsistentState
          type: object
        - additionalProperties: false
          description: >-
            Flat storage error, meaning that it doesn't support some block
            anymore.

            We guarantee that such block cannot become final, thus block
            processing

            must resume normally.
          properties:
            FlatStorageBlockNotSupported:
              type: string
          required:
            - FlatStorageBlockNotSupported
          type: object
        - additionalProperties: false
          description: In-memory trie could not be loaded for some reason.
          properties:
            MemTrieLoadingError:
              type: string
          required:
            - MemTrieLoadingError
          type: object
    DepositCostFailureReason:
      description: |-
        Reason why a gas key transaction failed at the deposit/account level.
        In these cases, gas is still charged from the gas key.
      enum:
        - NotEnoughBalance
        - LackBalanceForState
      type: string
    PublicKey:
      type: string
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
    ReceiptValidationError:
      description: Describes the error for validating a receipt.
      oneOf:
        - additionalProperties: false
          description: The `predecessor_id` of a Receipt is not valid.
          properties:
            InvalidPredecessorId:
              properties:
                account_id:
                  type: string
              required:
                - account_id
              type: object
          required:
            - InvalidPredecessorId
          type: object
        - additionalProperties: false
          description: The `receiver_id` of a Receipt is not valid.
          properties:
            InvalidReceiverId:
              properties:
                account_id:
                  type: string
              required:
                - account_id
              type: object
          required:
            - InvalidReceiverId
          type: object
        - additionalProperties: false
          description: The `signer_id` of an ActionReceipt is not valid.
          properties:
            InvalidSignerId:
              properties:
                account_id:
                  type: string
              required:
                - account_id
              type: object
          required:
            - InvalidSignerId
          type: object
        - additionalProperties: false
          description: >-
            The `receiver_id` of a DataReceiver within an ActionReceipt is not
            valid.
          properties:
            InvalidDataReceiverId:
              properties:
                account_id:
                  type: string
              required:
                - account_id
              type: object
          required:
            - InvalidDataReceiverId
          type: object
        - additionalProperties: false
          description: The length of the returned data exceeded the limit in a DataReceipt.
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
          description: >-
            The number of input data dependencies exceeds the limit in an
            ActionReceipt.
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
          description: An error occurred while validating actions of an ActionReceipt.
          properties:
            ActionsValidation:
              $ref: '#/components/schemas/ActionsValidationError'
          required:
            - ActionsValidation
          type: object
        - additionalProperties: false
          description: Receipt is bigger than the limit.
          properties:
            ReceiptSizeExceeded:
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
            - ReceiptSizeExceeded
          type: object
        - additionalProperties: false
          description: The `refund_to` of an ActionReceipt is not valid.
          properties:
            InvalidRefundTo:
              properties:
                account_id:
                  type: string
              required:
                - account_id
              type: object
          required:
            - InvalidRefundTo
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
    MissingTrieValue:
      properties:
        context:
          $ref: '#/components/schemas/MissingTrieValueContext'
        hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - context
        - hash
      type: object
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
    MissingTrieValueContext:
      description: Contexts in which `StorageError::MissingTrieValue` error might occur.
      oneOf:
        - description: Missing trie value when reading from TrieIterator.
          enum:
            - TrieIterator
          type: string
        - description: Missing trie value when reading from TriePrefetchingStorage.
          enum:
            - TriePrefetchingStorage
          type: string
        - description: Missing trie value when reading from TrieMemoryPartialStorage.
          enum:
            - TrieMemoryPartialStorage
          type: string
        - description: Missing trie value when reading from TrieStorage.
          enum:
            - TrieStorage
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