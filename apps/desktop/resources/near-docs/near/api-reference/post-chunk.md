> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post chunk

> Returns details of a specific chunk. You can run a block details query to get a valid chunk hash.



## OpenAPI

````yaml /openapi.json post /chunk
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /chunk:
    post:
      description: >-
        Returns details of a specific chunk. You can run a block details query
        to get a valid chunk hash.
      operationId: chunk
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_chunk'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcChunkResponse_and_RpcChunkError
components:
  schemas:
    JsonRpcRequest_for_chunk:
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
            - chunk
          type: string
        params:
          $ref: '#/components/schemas/RpcChunkRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_chunk
      type: object
    JsonRpcResponse_for_RpcChunkResponse_and_RpcChunkError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcChunkResponse'
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
      title: JsonRpcResponse_for_RpcChunkResponse_and_RpcChunkError
      type: object
    RpcChunkRequest:
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
      title: RpcChunkRequest
      type: object
    RpcChunkResponse:
      properties:
        author:
          $ref: '#/components/schemas/AccountId'
        header:
          $ref: '#/components/schemas/ChunkHeaderView'
        receipts:
          items:
            $ref: '#/components/schemas/ReceiptView'
          type: array
        transactions:
          items:
            $ref: '#/components/schemas/TransactionEnvelopeView'
          type: array
      required:
        - author
        - header
        - transactions
        - receipts
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
    ChunkHeaderView:
      description: Contains main info about the chunk.
      properties:
        balance_burnt:
          $ref: '#/components/schemas/NearToken'
        bandwidth_requests:
          anyOf:
            - $ref: '#/components/schemas/BandwidthRequests'
            - enum:
                - null
              nullable: true
        chunk_hash:
          $ref: '#/components/schemas/CryptoHash'
        congestion_info:
          anyOf:
            - $ref: '#/components/schemas/CongestionInfoView'
            - enum:
                - null
              nullable: true
        encoded_length:
          format: uint64
          minimum: 0
          type: integer
        encoded_merkle_root:
          $ref: '#/components/schemas/CryptoHash'
        gas_limit:
          $ref: '#/components/schemas/NearGas'
        gas_used:
          $ref: '#/components/schemas/NearGas'
        height_created:
          format: uint64
          minimum: 0
          type: integer
        height_included:
          format: uint64
          minimum: 0
          type: integer
        outcome_root:
          $ref: '#/components/schemas/CryptoHash'
        outgoing_receipts_root:
          $ref: '#/components/schemas/CryptoHash'
        prev_block_hash:
          $ref: '#/components/schemas/CryptoHash'
        prev_state_root:
          $ref: '#/components/schemas/CryptoHash'
        proposed_split:
          anyOf:
            - $ref: '#/components/schemas/TrieSplit'
            - enum:
                - null
              nullable: true
          description: >-
            Proposed trie split for dynamic resharding

            `None`: field missing (`ShardChunkHeaderInnerV4` or earlier)

            `Some(None)`: field present, but not set (`ChunkHeaderInnerV5` or
            later)

            `Some(Some(split))`: field present and set
        rent_paid:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          default: '0'
          description: 'TODO(2271): deprecated.'
        shard_id:
          $ref: '#/components/schemas/ShardId'
        signature:
          $ref: '#/components/schemas/Signature'
        tx_root:
          $ref: '#/components/schemas/CryptoHash'
        validator_proposals:
          items:
            $ref: '#/components/schemas/ValidatorStakeView'
          type: array
        validator_reward:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          default: '0'
          description: 'TODO(2271): deprecated.'
      required:
        - chunk_hash
        - prev_block_hash
        - outcome_root
        - prev_state_root
        - encoded_merkle_root
        - encoded_length
        - height_created
        - height_included
        - shard_id
        - gas_used
        - gas_limit
        - balance_burnt
        - outgoing_receipts_root
        - tx_root
        - validator_proposals
        - signature
      type: object
    ReceiptView:
      properties:
        predecessor_id:
          $ref: '#/components/schemas/AccountId'
        priority:
          default: 0
          description: Deprecated, retained for backward compatibility.
          format: uint64
          minimum: 0
          type: integer
        receipt:
          $ref: '#/components/schemas/ReceiptEnumView'
        receipt_id:
          $ref: '#/components/schemas/CryptoHash'
        receiver_id:
          $ref: '#/components/schemas/AccountId'
      required:
        - predecessor_id
        - receiver_id
        - receipt_id
        - receipt
      type: object
    TransactionEnvelopeView:
      anyOf:
        - $ref: '#/components/schemas/SignedTransactionView'
        - $ref: '#/components/schemas/EccTransactionView'
      description: >-
        A transaction in a chunk. Untagged so that a signed transaction keeps
        the JSON shape it

        always had.
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
    NearToken:
      type: string
    BandwidthRequests:
      description: |-
        A list of shard's bandwidth requests.
        Describes how much the shard would like to send to other shards.
      oneOf:
        - additionalProperties: false
          properties:
            V1:
              $ref: '#/components/schemas/BandwidthRequestsV1'
          required:
            - V1
          type: object
    CongestionInfoView:
      description: >-
        Stores the congestion level of a shard. More info about congestion
        [here](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)
      properties:
        allowed_shard:
          format: uint16
          maximum: 65535
          minimum: 0
          type: integer
        buffered_receipts_gas:
          type: string
        delayed_receipts_gas:
          type: string
        receipt_bytes:
          format: uint64
          minimum: 0
          type: integer
      required:
        - delayed_receipts_gas
        - buffered_receipts_gas
        - receipt_bytes
        - allowed_shard
      type: object
    NearGas:
      format: uint64
      minimum: 0
      type: integer
    TrieSplit:
      description: >-
        The result of splitting a memtrie into two possibly even parts,
        according to `memory_usage`

        stored in the trie nodes.


        **NOTE: This is an artificial value calculated according to `TRIE_COST`.
        Hence, it does not

        represent actual memory allocation, but the split ratio should be
        roughly consistent with that.**
      properties:
        boundary_account:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: Account ID representing the split path
        left_memory:
          description: Total `memory_usage` of the left part (excluding the split path)
          format: uint64
          minimum: 0
          type: integer
        right_memory:
          description: Total `memory_usage` of the right part (including the split path)
          format: uint64
          minimum: 0
          type: integer
      required:
        - boundary_account
        - left_memory
        - right_memory
      type: object
    Signature:
      type: string
    ValidatorStakeView:
      oneOf:
        - allOf:
            - $ref: '#/components/schemas/ValidatorStakeViewV1'
          properties:
            validator_stake_struct_version:
              enum:
                - V1
              type: string
          required:
            - validator_stake_struct_version
          type: object
    ReceiptEnumView:
      oneOf:
        - additionalProperties: false
          properties:
            Action:
              properties:
                actions:
                  items:
                    $ref: '#/components/schemas/ActionView'
                  type: array
                gas_price:
                  $ref: '#/components/schemas/NearToken'
                input_data_ids:
                  items:
                    $ref: '#/components/schemas/CryptoHash'
                  type: array
                is_promise_yield:
                  default: false
                  type: boolean
                output_data_receivers:
                  items:
                    $ref: '#/components/schemas/DataReceiverView'
                  type: array
                refund_to:
                  anyOf:
                    - $ref: '#/components/schemas/AccountId'
                    - enum:
                        - null
                      nullable: true
                signer_id:
                  $ref: '#/components/schemas/AccountId'
                signer_public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - signer_id
                - signer_public_key
                - gas_price
                - output_data_receivers
                - input_data_ids
                - actions
              type: object
          required:
            - Action
          type: object
        - additionalProperties: false
          properties:
            Data:
              properties:
                data:
                  default: null
                  nullable: true
                  type: string
                data_id:
                  $ref: '#/components/schemas/CryptoHash'
                is_promise_resume:
                  default: false
                  type: boolean
              required:
                - data_id
              type: object
          required:
            - Data
          type: object
        - additionalProperties: false
          properties:
            GlobalContractDistribution:
              properties:
                already_delivered_shards:
                  items:
                    $ref: '#/components/schemas/ShardId'
                  type: array
                code:
                  type: string
                id:
                  $ref: '#/components/schemas/GlobalContractIdentifier'
                nonce:
                  format: uint64
                  minimum: 0
                  nullable: true
                  type: integer
                target_shard:
                  $ref: '#/components/schemas/ShardId'
              required:
                - id
                - target_shard
                - already_delivered_shards
                - code
              type: object
          required:
            - GlobalContractDistribution
          type: object
    SignedTransactionView:
      properties:
        actions:
          items:
            $ref: '#/components/schemas/ActionView'
          type: array
        hash:
          $ref: '#/components/schemas/CryptoHash'
        nonce:
          format: uint64
          minimum: 0
          type: integer
        nonce_index:
          format: uint16
          maximum: 65535
          minimum: 0
          nullable: true
          type: integer
        nonce_mode:
          anyOf:
            - $ref: '#/components/schemas/NonceMode'
            - enum:
                - null
              nullable: true
        priority_fee:
          default: 0
          description: Deprecated, retained for backward compatibility.
          format: uint64
          minimum: 0
          type: integer
        public_key:
          $ref: '#/components/schemas/PublicKey'
        receiver_id:
          $ref: '#/components/schemas/AccountId'
        signature:
          $ref: '#/components/schemas/Signature'
        signer_id:
          $ref: '#/components/schemas/AccountId'
      required:
        - signer_id
        - public_key
        - nonce
        - receiver_id
        - actions
        - signature
        - hash
      type: object
    EccTransactionView:
      properties:
        contract_id:
          $ref: '#/components/schemas/AccountId'
        hash:
          $ref: '#/components/schemas/CryptoHash'
        payload:
          type: string
      required:
        - contract_id
        - payload
        - hash
      type: object
    ChunkHash:
      $ref: '#/components/schemas/CryptoHash'
    BandwidthRequestsV1:
      description: Version 1 of [`BandwidthRequest`].
      properties:
        requests:
          items:
            $ref: '#/components/schemas/BandwidthRequest'
          type: array
      required:
        - requests
      type: object
    ValidatorStakeViewV1:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        public_key:
          $ref: '#/components/schemas/PublicKey'
        stake:
          $ref: '#/components/schemas/NearToken'
      required:
        - account_id
        - public_key
        - stake
      type: object
    ActionView:
      oneOf:
        - enum:
            - CreateAccount
          type: string
        - additionalProperties: false
          properties:
            DeployContract:
              properties:
                code:
                  format: bytes
                  type: string
              required:
                - code
              type: object
          required:
            - DeployContract
          type: object
        - additionalProperties: false
          properties:
            FunctionCall:
              properties:
                args:
                  $ref: '#/components/schemas/FunctionArgs'
                deposit:
                  $ref: '#/components/schemas/NearToken'
                gas:
                  $ref: '#/components/schemas/NearGas'
                method_name:
                  type: string
              required:
                - method_name
                - args
                - gas
                - deposit
              type: object
          required:
            - FunctionCall
          type: object
        - additionalProperties: false
          properties:
            Transfer:
              properties:
                deposit:
                  $ref: '#/components/schemas/NearToken'
              required:
                - deposit
              type: object
          required:
            - Transfer
          type: object
        - additionalProperties: false
          properties:
            Stake:
              properties:
                public_key:
                  $ref: '#/components/schemas/PublicKey'
                stake:
                  $ref: '#/components/schemas/NearToken'
              required:
                - stake
                - public_key
              type: object
          required:
            - Stake
          type: object
        - additionalProperties: false
          properties:
            AddKey:
              properties:
                access_key:
                  $ref: '#/components/schemas/AccessKeyView'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
                - access_key
              type: object
          required:
            - AddKey
          type: object
        - additionalProperties: false
          properties:
            DeleteKey:
              properties:
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
              type: object
          required:
            - DeleteKey
          type: object
        - additionalProperties: false
          properties:
            DeleteAccount:
              properties:
                beneficiary_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - beneficiary_id
              type: object
          required:
            - DeleteAccount
          type: object
        - additionalProperties: false
          properties:
            Delegate:
              properties:
                delegate_action:
                  $ref: '#/components/schemas/DelegateAction'
                signature:
                  $ref: '#/components/schemas/Signature'
              required:
                - delegate_action
                - signature
              type: object
          required:
            - Delegate
          type: object
        - additionalProperties: false
          properties:
            DelegateV2:
              properties:
                delegate_action:
                  $ref: '#/components/schemas/VersionedDelegateActionPayload'
                signature:
                  $ref: '#/components/schemas/Signature'
              required:
                - delegate_action
                - signature
              type: object
          required:
            - DelegateV2
          type: object
        - additionalProperties: false
          properties:
            DeployGlobalContract:
              properties:
                code:
                  format: bytes
                  type: string
              required:
                - code
              type: object
          required:
            - DeployGlobalContract
          type: object
        - additionalProperties: false
          properties:
            DeployGlobalContractByAccountId:
              properties:
                code:
                  format: bytes
                  type: string
              required:
                - code
              type: object
          required:
            - DeployGlobalContractByAccountId
          type: object
        - additionalProperties: false
          properties:
            UseGlobalContract:
              properties:
                code_hash:
                  $ref: '#/components/schemas/CryptoHash'
              required:
                - code_hash
              type: object
          required:
            - UseGlobalContract
          type: object
        - additionalProperties: false
          properties:
            UseGlobalContractByAccountId:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - UseGlobalContractByAccountId
          type: object
        - additionalProperties: false
          properties:
            DeterministicStateInit:
              properties:
                code:
                  $ref: '#/components/schemas/GlobalContractIdentifierView'
                data:
                  additionalProperties:
                    type: string
                  type: object
                deposit:
                  $ref: '#/components/schemas/NearToken'
              required:
                - code
                - data
                - deposit
              type: object
          required:
            - DeterministicStateInit
          type: object
        - additionalProperties: false
          properties:
            TransferToGasKey:
              properties:
                deposit:
                  $ref: '#/components/schemas/NearToken'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
                - deposit
              type: object
          required:
            - TransferToGasKey
          type: object
        - additionalProperties: false
          properties:
            WithdrawFromGasKey:
              properties:
                amount:
                  $ref: '#/components/schemas/NearToken'
                public_key:
                  $ref: '#/components/schemas/PublicKey'
              required:
                - public_key
                - amount
              type: object
          required:
            - WithdrawFromGasKey
          type: object
        - additionalProperties: false
          properties:
            UniversalStateInit:
              properties:
                deposit:
                  $ref: '#/components/schemas/NearToken'
                state_init:
                  $ref: '#/components/schemas/RawStateInit'
              required:
                - state_init
                - deposit
              type: object
          required:
            - UniversalStateInit
          type: object
    DataReceiverView:
      properties:
        data_id:
          $ref: '#/components/schemas/CryptoHash'
        receiver_id:
          $ref: '#/components/schemas/AccountId'
      required:
        - data_id
        - receiver_id
      type: object
    PublicKey:
      type: string
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
    NonceMode:
      description: >-
        Controls how the transaction nonce is validated against the access key
        nonce.
      oneOf:
        - description: >-
            Any nonce strictly greater than the current access key nonce
            (default behavior).
          enum:
            - monotonic
          type: string
        - description: Nonce must be exactly `ak_nonce + 1` (sequential ordering).
          enum:
            - strict
          type: string
    BandwidthRequest:
      description: >-
        `BandwidthRequest` describes the size of receipts that a shard would
        like to send to another shard.

        When a shard wants to send a lot of receipts to another shard, it needs
        to create a request and wait

        for a bandwidth grant from the bandwidth scheduler.
      properties:
        requested_values_bitmap:
          allOf:
            - $ref: '#/components/schemas/BandwidthRequestBitmap'
          description: Bitmap which describes what values of bandwidth are requested.
        to_shard:
          description: Requesting bandwidth to this shard.
          format: uint16
          maximum: 65535
          minimum: 0
          type: integer
      required:
        - to_shard
        - requested_values_bitmap
      type: object
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
    DelegateAction:
      description: >-
        This action allows to execute the inner actions behalf of the defined
        sender.
      properties:
        actions:
          description: >-
            List of actions to be executed.


            With the meta transactions MVP defined in NEP-366, nested

            DelegateActions are not allowed. A separate type is used to enforce
            it.
          items:
            $ref: '#/components/schemas/NonDelegateAction'
          type: array
        max_block_height:
          description: >-
            The maximal height of the block in the blockchain below which the
            given DelegateAction is valid.
          format: uint64
          minimum: 0
          type: integer
        nonce:
          description: |-
            Nonce to ensure that the same delegate action is not sent twice by a
            relayer and should match for given account's `public_key`.
            After this action is processed it will increment.
          format: uint64
          minimum: 0
          type: integer
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: Public key used to sign this delegated action.
        receiver_id:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: Receiver of the delegated actions.
        sender_id:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: Signer of the delegated actions
      required:
        - sender_id
        - receiver_id
        - actions
        - nonce
        - max_block_height
        - public_key
      type: object
    VersionedDelegateActionPayload:
      description: >-
        Versions of the delegate action carried by `Action::DelegateV2`. New

        versions add a variant here rather than a new `Action` variant. The
        variant

        is part of the signed payload, so a signature can't be ambiguous across

        versions.
      oneOf:
        - additionalProperties: false
          properties:
            V2:
              $ref: '#/components/schemas/DelegateActionV2'
          required:
            - V2
          type: object
    GlobalContractIdentifierView:
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
    RawStateInit:
      description: >-
        Raw bytes containing borsh-serialized `UniversalStateInit`.


        This is the protocol's view of a state init, not a mere transport
        wrapper: the

        account ID is SHA3-256 over exactly these bytes. The typed form is a
        decoded

        *view* of them, used to install the state and to price the action, and
        it is

        never re-serialized to derive an ID. From `CanonicalUniversalStateInit`
        on, only

        the canonical encoding is accepted (see
        `UniversalStateInit::from_raw_strict`), so

        each logical value has one ID.


        It also lets an immutable contract pass through a `UniversalStateInit`
        version it

        predates: the bytes travel verbatim, so a version added after the
        contract was

        compiled still works.


        Borsh-serializing `RawStateInit` writes a 4-byte length prefix before
        the

        bytes, which is how the `UniversalStateInit` action carries it as a
        field;

        over serde the bytes are base64. Neither is what the account ID hashes:
        that

        is `self.0` alone, never `borsh::to_vec(self)`.
      type: string
    BandwidthRequestBitmap:
      description: >-
        Bitmap which describes which values from the predefined list are being
        requested.

        The nth bit is set to 1 when the nth value from the list is being
        requested.
      properties:
        data:
          items:
            format: uint8
            maximum: 255
            minimum: 0
            type: integer
          maxItems: 5
          minItems: 5
          type: array
      required:
        - data
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
    NonDelegateAction:
      description: >-
        An Action that can be included in a transaction or receipt, excluding
        delegate actions. This type represents all possible action types except
        DelegateAction to prevent infinite recursion in meta-transactions.
      oneOf:
        - additionalProperties: false
          description: >-
            Create an (sub)account using a transaction `receiver_id` as an ID
            for

            a new account ID must pass validation rules described here

            <https://nomicon.io/DataStructures/Account>.
          properties:
            CreateAccount:
              $ref: '#/components/schemas/CreateAccountAction'
          required:
            - CreateAccount
          type: object
        - additionalProperties: false
          description: Sets a Wasm code to a receiver_id
          properties:
            DeployContract:
              $ref: '#/components/schemas/DeployContractAction'
          required:
            - DeployContract
          type: object
        - additionalProperties: false
          properties:
            FunctionCall:
              $ref: '#/components/schemas/FunctionCallAction'
          required:
            - FunctionCall
          type: object
        - additionalProperties: false
          properties:
            Transfer:
              $ref: '#/components/schemas/TransferAction'
          required:
            - Transfer
          type: object
        - additionalProperties: false
          properties:
            Stake:
              $ref: '#/components/schemas/StakeAction'
          required:
            - Stake
          type: object
        - additionalProperties: false
          properties:
            AddKey:
              $ref: '#/components/schemas/AddKeyAction'
          required:
            - AddKey
          type: object
        - additionalProperties: false
          properties:
            DeleteKey:
              $ref: '#/components/schemas/DeleteKeyAction'
          required:
            - DeleteKey
          type: object
        - additionalProperties: false
          properties:
            DeleteAccount:
              $ref: '#/components/schemas/DeleteAccountAction'
          required:
            - DeleteAccount
          type: object
        - additionalProperties: false
          properties:
            DeployGlobalContract:
              $ref: '#/components/schemas/DeployGlobalContractAction'
          required:
            - DeployGlobalContract
          type: object
        - additionalProperties: false
          properties:
            UseGlobalContract:
              $ref: '#/components/schemas/UseGlobalContractAction'
          required:
            - UseGlobalContract
          type: object
        - additionalProperties: false
          properties:
            DeterministicStateInit:
              $ref: '#/components/schemas/DeterministicStateInitAction'
          required:
            - DeterministicStateInit
          type: object
        - additionalProperties: false
          properties:
            TransferToGasKey:
              $ref: '#/components/schemas/TransferToGasKeyAction'
          required:
            - TransferToGasKey
          type: object
        - additionalProperties: false
          properties:
            WithdrawFromGasKey:
              $ref: '#/components/schemas/WithdrawFromGasKeyAction'
          required:
            - WithdrawFromGasKey
          type: object
        - additionalProperties: false
          properties:
            UniversalStateInit:
              $ref: '#/components/schemas/UniversalStateInitAction'
          required:
            - UniversalStateInit
          type: object
    DelegateActionV2:
      description: |-
        Delegate action with gas key support: `nonce` selects either the access
        key's nonce or one of a gas key's parallel nonces by index, mirroring
        `TransactionV1`.
      properties:
        actions:
          description: List of actions to be executed.
          items:
            $ref: '#/components/schemas/NonDelegateAction'
          type: array
        max_block_height:
          description: >-
            The maximal height of the block in the blockchain below which the
            given DelegateActionV2 is valid.
          format: uint64
          minimum: 0
          type: integer
        nonce:
          allOf:
            - $ref: '#/components/schemas/TransactionNonce'
          description: >-
            Nonce of the signing key, advanced when this action is processed.
            For

            a gas key it also selects which of the parallel nonces to advance.
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: Public key used to sign this delegated action.
        receiver_id:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: Receiver of the delegated actions.
        sender_id:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: Signer of the delegated actions
      required:
        - sender_id
        - receiver_id
        - actions
        - nonce
        - max_block_height
        - public_key
      type: object
    CreateAccountAction:
      description: Create account action
      type: object
    DeployContractAction:
      description: Deploy contract action
      properties:
        code:
          description: WebAssembly binary
          type: string
      required:
        - code
      type: object
    FunctionCallAction:
      properties:
        args:
          type: string
        deposit:
          $ref: '#/components/schemas/NearToken'
        gas:
          $ref: '#/components/schemas/NearGas'
        method_name:
          type: string
      required:
        - method_name
        - args
        - gas
        - deposit
      type: object
    TransferAction:
      properties:
        deposit:
          $ref: '#/components/schemas/NearToken'
      required:
        - deposit
      type: object
    StakeAction:
      description: An action which stakes signer_id tokens and setup's validator public key
      properties:
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: >-
            Validator key which will be used to sign transactions on behalf of
            signer_id
        stake:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Amount of tokens to stake.
      required:
        - stake
        - public_key
      type: object
    AddKeyAction:
      description: An action that adds key with public key associated
      properties:
        access_key:
          allOf:
            - $ref: '#/components/schemas/AccessKey'
          description: An access key with the permission
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: A public key which will be associated with an access_key
      required:
        - public_key
        - access_key
      type: object
    DeleteKeyAction:
      properties:
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: A public key associated with the access_key to be deleted.
      required:
        - public_key
      type: object
    DeleteAccountAction:
      properties:
        beneficiary_id:
          $ref: '#/components/schemas/AccountId'
      required:
        - beneficiary_id
      type: object
    DeployGlobalContractAction:
      description: Deploy global contract action
      properties:
        code:
          description: WebAssembly binary
          type: string
        deploy_mode:
          $ref: '#/components/schemas/GlobalContractDeployMode'
      required:
        - code
        - deploy_mode
      type: object
    UseGlobalContractAction:
      description: Use global contract action
      properties:
        contract_identifier:
          $ref: '#/components/schemas/GlobalContractIdentifier'
      required:
        - contract_identifier
      type: object
    DeterministicStateInitAction:
      properties:
        deposit:
          $ref: '#/components/schemas/NearToken'
        state_init:
          $ref: '#/components/schemas/DeterministicAccountStateInit'
      required:
        - state_init
        - deposit
      type: object
    TransferToGasKeyAction:
      description: Transfer NEAR to a gas key's balance
      properties:
        deposit:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Amount of NEAR to transfer to the gas key
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: The public key of the gas key to fund
      required:
        - public_key
        - deposit
      type: object
    WithdrawFromGasKeyAction:
      description: >-
        Withdraw NEAR from a gas key's balance to the account.


        This action must only be available via transactions, not via contract
        execution

        (there is no corresponding promise batch action host function).
      properties:
        amount:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Amount of NEAR to transfer from the gas key
        public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: The public key of the gas key to withdraw from
      required:
        - public_key
        - amount
      type: object
    UniversalStateInitAction:
      description: >-
        Create a `0u` universal account from its state init. The receiver id
        must

        equal `derive_universal_account_id(state_init)`; the attached `deposit`

        covers the new account's storage staking.


        The state init travels as the bytes the producer serialized, because the

        receiver id commits to exactly those bytes. The typed
        [`UniversalStateInit`]

        is a decoded view of them, used where the state has to be installed or
        priced.
      properties:
        deposit:
          $ref: '#/components/schemas/NearToken'
        state_init:
          $ref: '#/components/schemas/RawStateInit'
      required:
        - state_init
        - deposit
      type: object
    TransactionNonce:
      oneOf:
        - additionalProperties: false
          description: Simple nonce without index, used by ordinary access keys
          properties:
            Nonce:
              properties:
                nonce:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - nonce
              type: object
          required:
            - Nonce
          type: object
        - additionalProperties: false
          description: Nonce with index, used by gas keys
          properties:
            GasKeyNonce:
              properties:
                nonce:
                  format: uint64
                  minimum: 0
                  type: integer
                nonce_index:
                  format: uint16
                  maximum: 65535
                  minimum: 0
                  type: integer
              required:
                - nonce
                - nonce_index
              type: object
          required:
            - GasKeyNonce
          type: object
    AccessKey:
      description: >-
        Access key provides limited access to an account. Each access key
        belongs to some account and

        is identified by a unique (within the account) public key. One account
        may have large number of

        access keys. Access keys allow to act on behalf of the account by
        restricting transactions

        that can be issued.

        `account_id,public_key` is a key in the state
      properties:
        nonce:
          description: >-
            Nonce for this access key, used for tx nonce generation. When access
            key is created, nonce

            is set to `block_height * 1e6 - 1` (`(block_height - 1) * 1e6`
            before protocol version 89)

            to avoid tx hash collision on access key re-creation.

            See <https://github.com/near/nearcore/issues/3779> for more details.
          format: uint64
          minimum: 0
          type: integer
        permission:
          allOf:
            - $ref: '#/components/schemas/AccessKeyPermission'
          description: Defines permissions for this access key.
      required:
        - nonce
        - permission
      type: object
    GlobalContractDeployMode:
      oneOf:
        - description: |-
            Contract is deployed under its code hash.
            Users will be able reference it by that hash.
            This effectively makes the contract immutable.
          enum:
            - CodeHash
          type: string
        - description: |-
            Contract is deployed under the owner account id.
            Users will be able reference it by that account id.
            This allows the owner to update the contract for all its users.
          enum:
            - AccountId
          type: string
    DeterministicAccountStateInit:
      oneOf:
        - additionalProperties: false
          properties:
            V1:
              $ref: '#/components/schemas/DeterministicAccountStateInitV1'
          required:
            - V1
          type: object
    AccessKeyPermission:
      description: Defines permissions for AccessKey
      oneOf:
        - additionalProperties: false
          properties:
            FunctionCall:
              $ref: '#/components/schemas/FunctionCallPermission'
          required:
            - FunctionCall
          type: object
        - description: |-
            Grants full access to the account.
            NOTE: It's used to replace account-level public keys.
          enum:
            - FullAccess
          type: string
        - additionalProperties: false
          description: >-
            Gas key with limited permission to make transactions with
            FunctionCallActions

            Gas keys are a kind of access keys with a prepaid balance to pay for
            gas.
          properties:
            GasKeyFunctionCall:
              items:
                oneOf:
                  - $ref: '#/components/schemas/GasKeyInfo'
                  - $ref: '#/components/schemas/FunctionCallPermission'
              maxItems: 2
              minItems: 2
              type: array
              description: 'Positional tuple of 2: [GasKeyInfo, FunctionCallPermission].'
          required:
            - GasKeyFunctionCall
          type: object
        - additionalProperties: false
          description: >-
            Gas key with full access to the account.

            Gas keys are a kind of access keys with a prepaid balance to pay for
            gas.
          properties:
            GasKeyFullAccess:
              $ref: '#/components/schemas/GasKeyInfo'
          required:
            - GasKeyFullAccess
          type: object
    DeterministicAccountStateInitV1:
      properties:
        code:
          $ref: '#/components/schemas/GlobalContractIdentifier'
        data:
          additionalProperties:
            type: string
          type: object
      required:
        - code
        - data
      type: object
    FunctionCallPermission:
      description: >-
        Grants limited permission to make transactions with FunctionCallActions

        The permission can limit the allowed balance to be spent on the prepaid
        gas.

        It also restrict the account ID of the receiver for this function call.

        It also can restrict the method name for the allowed function calls.
      properties:
        allowance:
          anyOf:
            - $ref: '#/components/schemas/NearToken'
            - enum:
                - null
              nullable: true
          description: >-
            Allowance is a balance limit to use by this access key to pay for
            function call gas and

            transaction fees. When this access key is used, both account balance
            and the allowance is

            decreased by the same value.

            `None` means unlimited allowance.

            NOTE: To change or increase the allowance, the old access key needs
            to be deleted and a new

            access key should be created.
        method_names:
          description: >-
            A list of method names that can be used. The access key only allows
            transactions with the

            function call of one of the given method names.

            Empty list means any method name can be used.
          items:
            type: string
          type: array
        receiver_id:
          description: >-
            The access key only allows transactions with the given receiver's
            account id.
          type: string
      required:
        - receiver_id
        - method_names
      type: object
    GasKeyInfo:
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.