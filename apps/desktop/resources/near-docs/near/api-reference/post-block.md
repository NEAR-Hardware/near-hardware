> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post block

> Returns block details for given height or hash



## OpenAPI

````yaml /openapi.json post /block
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /block:
    post:
      description: Returns block details for given height or hash
      operationId: block
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_block'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcBlockResponse_and_RpcBlockError
components:
  schemas:
    JsonRpcRequest_for_block:
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
            - block
          type: string
        params:
          $ref: '#/components/schemas/RpcBlockRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_block
      type: object
    JsonRpcResponse_for_RpcBlockResponse_and_RpcBlockError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcBlockResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcBlockError'
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
      title: JsonRpcResponse_for_RpcBlockResponse_and_RpcBlockError
      type: object
    RpcBlockRequest:
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
      title: RpcBlockRequest
      type: object
    RpcBlockResponse:
      properties:
        author:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: The AccountId of the author of the Block
        chunks:
          items:
            $ref: '#/components/schemas/ChunkHeaderView'
          type: array
        header:
          $ref: '#/components/schemas/BlockHeaderView'
      required:
        - author
        - header
        - chunks
      type: object
    ErrorWrapper_for_RpcBlockError:
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
              $ref: '#/components/schemas/RpcBlockError'
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
    BlockHeaderView:
      description: Contains main info about the block.
      properties:
        approvals:
          items:
            anyOf:
              - $ref: '#/components/schemas/Signature'
              - enum:
                  - null
                nullable: true
          type: array
        block_body_hash:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
        block_merkle_root:
          $ref: '#/components/schemas/CryptoHash'
        block_ordinal:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        challenges_result:
          items:
            $ref: '#/components/schemas/SlashedValidator'
          type: array
        challenges_root:
          $ref: '#/components/schemas/CryptoHash'
        chunk_endorsements:
          items:
            items:
              format: uint8
              maximum: 255
              minimum: 0
              type: integer
            type: array
          nullable: true
          type: array
        chunk_execution_root:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
        chunk_headers_root:
          $ref: '#/components/schemas/CryptoHash'
        chunk_mask:
          items:
            type: boolean
          type: array
        chunk_receipts_root:
          $ref: '#/components/schemas/CryptoHash'
        chunk_tx_root:
          $ref: '#/components/schemas/CryptoHash'
        chunks_included:
          format: uint64
          minimum: 0
          type: integer
        epoch_id:
          $ref: '#/components/schemas/CryptoHash'
        epoch_sync_data_hash:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
        gas_price:
          $ref: '#/components/schemas/NearToken'
        hash:
          $ref: '#/components/schemas/CryptoHash'
        height:
          format: uint64
          minimum: 0
          type: integer
        last_ds_final_block:
          $ref: '#/components/schemas/CryptoHash'
        last_final_block:
          $ref: '#/components/schemas/CryptoHash'
        latest_protocol_version:
          format: uint32
          minimum: 0
          type: integer
        next_bp_hash:
          $ref: '#/components/schemas/CryptoHash'
        next_epoch_id:
          $ref: '#/components/schemas/CryptoHash'
        outcome_root:
          $ref: '#/components/schemas/CryptoHash'
        prev_hash:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: The hash of the previous Block
        prev_height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        prev_last_certified_block_epoch_id:
          anyOf:
            - $ref: '#/components/schemas/EpochId'
            - enum:
                - null
              nullable: true
        prev_state_root:
          $ref: '#/components/schemas/CryptoHash'
        random_value:
          $ref: '#/components/schemas/CryptoHash'
        rent_paid:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          default: '0'
          description: 'TODO(2271): deprecated.'
        shard_split:
          items:
            oneOf:
              - $ref: '#/components/schemas/ShardId'
              - $ref: '#/components/schemas/AccountId'
          maxItems: 2
          minItems: 2
          nullable: true
          type: array
          description: 'Positional tuple of 2: [ShardId, AccountId].'
        signature:
          allOf:
            - $ref: '#/components/schemas/Signature'
          description: Signature of the block producer.
        spice_chunk_endorsement_stats:
          items:
            $ref: '#/components/schemas/SpiceChunkEndorsementStats'
          nullable: true
          type: array
        timestamp:
          description: Legacy json number. Should not be used.
          format: uint64
          minimum: 0
          type: integer
        timestamp_nanosec:
          type: string
        total_supply:
          $ref: '#/components/schemas/NearToken'
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
        - height
        - epoch_id
        - next_epoch_id
        - hash
        - prev_hash
        - prev_state_root
        - chunk_receipts_root
        - chunk_headers_root
        - chunk_tx_root
        - outcome_root
        - chunks_included
        - challenges_root
        - timestamp
        - timestamp_nanosec
        - random_value
        - validator_proposals
        - chunk_mask
        - gas_price
        - total_supply
        - challenges_result
        - last_final_block
        - last_ds_final_block
        - next_bp_hash
        - block_merkle_root
        - approvals
        - signature
        - latest_protocol_version
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
    RpcBlockError:
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
    CryptoHash:
      type: string
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
    SlashedValidator:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        is_double_sign:
          type: boolean
      required:
        - account_id
        - is_double_sign
      type: object
    EpochId:
      allOf:
        - $ref: '#/components/schemas/CryptoHash'
      description: |-
        Epoch identifier -- wrapped hash, to make it easier to distinguish.
        EpochId of epoch T is the hash of last block in T-2
        EpochId of first two epochs is 0
    SpiceChunkEndorsementStats:
      description: >-
        Per-validator chunk endorsement stats accumulated over a spice epoch,

        indexed by the current epoch's validator id. Carried on the last block
        of

        the epoch (see `BlockHeaderInnerRestV8`) and consumed by reward and
        kickout.
      properties:
        expected:
          format: uint32
          minimum: 0
          type: integer
        produced:
          format: uint32
          minimum: 0
          type: integer
      required:
        - produced
        - expected
      type: object
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
    PublicKey:
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.