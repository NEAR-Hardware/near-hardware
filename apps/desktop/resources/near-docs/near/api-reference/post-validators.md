> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post validators

> Queries active validators on the network. Returns details and the state of validation on the blockchain.



## OpenAPI

````yaml /openapi.json post /validators
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /validators:
    post:
      description: >-
        Queries active validators on the network. Returns details and the state
        of validation on the blockchain.
      operationId: validators
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_validators'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcValidatorResponse_and_RpcValidatorError
components:
  schemas:
    JsonRpcRequest_for_validators:
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
            - validators
          type: string
        params:
          $ref: '#/components/schemas/RpcValidatorRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_validators
      type: object
    JsonRpcResponse_for_RpcValidatorResponse_and_RpcValidatorError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcValidatorResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcValidatorError'
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
      title: JsonRpcResponse_for_RpcValidatorResponse_and_RpcValidatorError
      type: object
    RpcValidatorRequest:
      oneOf:
        - properties:
            epoch_id:
              $ref: '#/components/schemas/EpochId'
          required:
            - epoch_id
          type: object
        - properties:
            block_id:
              $ref: '#/components/schemas/BlockId'
          required:
            - block_id
          type: object
        - properties:
            latest:
              enum:
                - null
              nullable: true
          required:
            - latest
          type: object
      title: RpcValidatorRequest
      type: object
    RpcValidatorResponse:
      description: Information about this epoch validators and next epoch validators
      properties:
        current_fishermen:
          description: Fishermen for the current epoch
          items:
            $ref: '#/components/schemas/ValidatorStakeView'
          type: array
        current_proposals:
          description: Proposals in the current epoch
          items:
            $ref: '#/components/schemas/ValidatorStakeView'
          type: array
        current_validators:
          description: Validators for the current epoch
          items:
            $ref: '#/components/schemas/CurrentEpochValidatorInfo'
          type: array
        epoch_height:
          description: Epoch height
          format: uint64
          minimum: 0
          type: integer
        epoch_start_height:
          description: Epoch start block height
          format: uint64
          minimum: 0
          type: integer
        next_fishermen:
          description: Fishermen for the next epoch
          items:
            $ref: '#/components/schemas/ValidatorStakeView'
          type: array
        next_validators:
          description: Validators for the next epoch
          items:
            $ref: '#/components/schemas/NextEpochValidatorInfo'
          type: array
        prev_epoch_kickout:
          description: Kickout in the previous epoch
          items:
            $ref: '#/components/schemas/ValidatorKickoutView'
          type: array
        validator_reward_paid_prev_epoch:
          additionalProperties:
            $ref: '#/components/schemas/NearToken'
          default: {}
          description: |-
            Per-validator rewards paid out at the start of the previous epoch.
            For epoch E, this contains the rewards earned in epoch E-2 that were
            added to validator and treasury balances at the first block of epoch
            E-1 (via `ValidatorAccountsUpdate`).
          type: object
      required:
        - current_validators
        - next_validators
        - current_fishermen
        - next_fishermen
        - current_proposals
        - prev_epoch_kickout
        - epoch_start_height
        - epoch_height
      type: object
    ErrorWrapper_for_RpcValidatorError:
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
              $ref: '#/components/schemas/RpcValidatorError'
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
    EpochId:
      allOf:
        - $ref: '#/components/schemas/CryptoHash'
      description: |-
        Epoch identifier -- wrapped hash, to make it easier to distinguish.
        EpochId of epoch T is the hash of last block in T-2
        EpochId of first two epochs is 0
    BlockId:
      anyOf:
        - format: uint64
          minimum: 0
          title: block_height
          type: integer
        - $ref: '#/components/schemas/CryptoHash'
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
    CurrentEpochValidatorInfo:
      description: Describes information about the current epoch validator
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        is_slashed:
          type: boolean
        num_expected_blocks:
          format: uint64
          minimum: 0
          type: integer
        num_expected_chunks:
          default: 0
          format: uint64
          minimum: 0
          type: integer
        num_expected_chunks_per_shard:
          default: []
          description: >-
            Number of chunks this validator was expected to produce in each
            shard.

            Each entry in the array corresponds to the shard in the
            `shards_produced` array.
          items:
            format: uint64
            minimum: 0
            type: integer
          type: array
        num_expected_endorsements:
          default: 0
          format: uint64
          minimum: 0
          type: integer
        num_expected_endorsements_per_shard:
          default: []
          description: >-
            Number of chunks this validator was expected to validate and endorse
            in each shard.

            Each entry in the array corresponds to the shard in the
            `shards_endorsed` array.
          items:
            format: uint64
            minimum: 0
            type: integer
          type: array
        num_produced_blocks:
          format: uint64
          minimum: 0
          type: integer
        num_produced_chunks:
          default: 0
          format: uint64
          minimum: 0
          type: integer
        num_produced_chunks_per_shard:
          default: []
          items:
            format: uint64
            minimum: 0
            type: integer
          type: array
        num_produced_endorsements:
          default: 0
          format: uint64
          minimum: 0
          type: integer
        num_produced_endorsements_per_shard:
          default: []
          items:
            format: uint64
            minimum: 0
            type: integer
          type: array
        public_key:
          $ref: '#/components/schemas/PublicKey'
        shards:
          description: >-
            Shards this validator is assigned to as chunk producer in the
            current epoch.
          items:
            $ref: '#/components/schemas/ShardId'
          type: array
        shards_endorsed:
          default: []
          description: >-
            Shards this validator is assigned to as chunk validator in the
            current epoch.
          items:
            $ref: '#/components/schemas/ShardId'
          type: array
        stake:
          $ref: '#/components/schemas/NearToken'
      required:
        - account_id
        - public_key
        - is_slashed
        - stake
        - shards
        - num_produced_blocks
        - num_expected_blocks
      type: object
    NextEpochValidatorInfo:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        public_key:
          $ref: '#/components/schemas/PublicKey'
        shards:
          items:
            $ref: '#/components/schemas/ShardId'
          type: array
        stake:
          $ref: '#/components/schemas/NearToken'
      required:
        - account_id
        - public_key
        - stake
        - shards
      type: object
    ValidatorKickoutView:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        reason:
          $ref: '#/components/schemas/ValidatorKickoutReason'
      required:
        - account_id
        - reason
      type: object
    NearToken:
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
    RpcValidatorError:
      oneOf:
        - properties:
            name:
              enum:
                - UNKNOWN_EPOCH
              type: string
          required:
            - name
          type: object
        - properties:
            name:
              enum:
                - VALIDATOR_INFO_UNAVAILABLE
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
    PublicKey:
      type: string
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
    ValidatorKickoutReason:
      description: Reasons for removing a validator from the validator set.
      oneOf:
        - description: Deprecated
          enum:
            - _UnusedSlashed
          type: string
        - additionalProperties: false
          description: Validator didn't produce enough blocks.
          properties:
            NotEnoughBlocks:
              properties:
                expected:
                  format: uint64
                  minimum: 0
                  type: integer
                produced:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - produced
                - expected
              type: object
          required:
            - NotEnoughBlocks
          type: object
        - additionalProperties: false
          description: Validator didn't produce enough chunks.
          properties:
            NotEnoughChunks:
              properties:
                expected:
                  format: uint64
                  minimum: 0
                  type: integer
                produced:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - produced
                - expected
              type: object
          required:
            - NotEnoughChunks
          type: object
        - description: Validator unstaked themselves.
          enum:
            - Unstaked
          type: string
        - additionalProperties: false
          description: Validator stake is now below threshold
          properties:
            NotEnoughStake:
              properties:
                stake_u128:
                  $ref: '#/components/schemas/NearToken'
                threshold_u128:
                  $ref: '#/components/schemas/NearToken'
              required:
                - stake_u128
                - threshold_u128
              type: object
          required:
            - NotEnoughStake
          type: object
        - description: Enough stake but is not chosen because of seat limits.
          enum:
            - DidNotGetASeat
          type: string
        - additionalProperties: false
          description: Validator didn't produce enough chunk endorsements.
          properties:
            NotEnoughChunkEndorsements:
              properties:
                expected:
                  format: uint64
                  minimum: 0
                  type: integer
                produced:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - produced
                - expected
              type: object
          required:
            - NotEnoughChunkEndorsements
          type: object
        - additionalProperties: false
          description: >-
            Validator's last block proposal was for a protocol version older
            than

            the network's voted protocol version.
          properties:
            ProtocolVersionTooOld:
              properties:
                network_version:
                  format: uint32
                  minimum: 0
                  type: integer
                version:
                  format: uint32
                  minimum: 0
                  type: integer
              required:
                - version
                - network_version
              type: object
          required:
            - ProtocolVersionTooOld
          type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.