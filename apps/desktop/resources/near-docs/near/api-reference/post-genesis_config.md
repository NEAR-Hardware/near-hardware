> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post genesis config

> Get initial state and parameters for the genesis block



## OpenAPI

````yaml /openapi.json post /genesis_config
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /genesis_config:
    post:
      description: Get initial state and parameters for the genesis block
      operationId: genesis_config
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_genesis_config'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_GenesisConfig_and_GenesisConfigError
components:
  schemas:
    JsonRpcRequest_for_genesis_config:
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
            - genesis_config
          type: string
        params:
          $ref: '#/components/schemas/GenesisConfigRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_genesis_config
      type: object
    JsonRpcResponse_for_GenesisConfig_and_GenesisConfigError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/GenesisConfig'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_GenesisConfigError'
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
      title: JsonRpcResponse_for_GenesisConfig_and_GenesisConfigError
      type: object
    GenesisConfigRequest:
      enum:
        - null
      nullable: true
      title: GenesisConfigRequest
    GenesisConfig:
      properties:
        block_producer_kickout_threshold:
          description: Threshold for kicking out block producers, between 0 and 100.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        chain_id:
          description: >-
            ID of the blockchain. This must be unique for every blockchain.

            If your testnet blockchains do not have unique chain IDs, you will
            have a bad time.
          type: string
        chunk_producer_assignment_changes_limit:
          default: 5
          description: |-
            Limits the number of shard changes in chunk producer assignments,
            if algorithm is able to choose assignment with better balance of
            number of chunk producers for shards.
          format: uint64
          minimum: 0
          type: integer
        chunk_producer_kickout_threshold:
          description: Threshold for kicking out chunk producers, between 0 and 100.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        chunk_validator_only_kickout_threshold:
          default: 80
          description: >-
            Threshold for kicking out nodes which are only chunk validators,
            between 0 and 100.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        dynamic_resharding:
          description: Enable dynamic re-sharding.
          type: boolean
        epoch_length:
          description: Epoch length counted in block heights.
          format: uint64
          minimum: 0
          type: integer
        fishermen_threshold:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Fishermen stake threshold.
        gas_limit:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Initial gas limit.
        gas_price_adjustment_rate:
          description: Gas price adjustment rate
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        genesis_height:
          description: Height of genesis block.
          format: uint64
          minimum: 0
          type: integer
        genesis_time:
          description: Official time of blockchain start.
          format: date-time
          type: string
        max_gas_price:
          $ref: '#/components/schemas/NearToken'
        max_inflation_rate:
          description: Maximum inflation on the total supply every epoch.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        max_kickout_stake_perc:
          default: 100
          description: Max stake percentage of the validators we will kick out.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        min_gas_price:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Minimum gas price. It is also the initial gas price.
        minimum_stake_divisor:
          default: 10
          description: >-
            The minimum stake required for staking is last seat price divided by
            this number.
          format: uint64
          minimum: 0
          type: integer
        minimum_stake_ratio:
          default:
            - 1
            - 6250
          description: |-
            The lowest ratio s/s_total any block producer can have.
            See <https://github.com/near/NEPs/pull/167> for details
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        minimum_validators_per_shard:
          default: 1
          description: The minimum number of validators each shard must have
          format: uint64
          minimum: 0
          type: integer
        num_block_producer_seats:
          description: Number of block producer seats at genesis.
          format: uint64
          minimum: 0
          type: integer
        num_blocks_per_year:
          description: Expected number of blocks per year
          format: uint64
          minimum: 0
          type: integer
        num_chunk_producer_seats:
          default: 100
          description: >-
            Number of chunk producers.

            Don't mess it up with chunk-only producers feature which is
            deprecated.
          format: uint64
          minimum: 0
          type: integer
        num_chunk_validator_seats:
          default: 300
          format: uint64
          minimum: 0
          type: integer
        online_max_threshold:
          default:
            - 99
            - 100
          description: Online maximum threshold above which validator gets full reward.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        online_min_threshold:
          default:
            - 9
            - 10
          description: >-
            Online minimum threshold below which validator doesn't receive
            reward.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        protocol_reward_rate:
          description: Protocol treasury rate
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        protocol_treasury_account:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: Protocol treasury account
        protocol_upgrade_stake_threshold:
          default:
            - 4
            - 5
          description: >-
            Threshold of stake that needs to indicate that they ready for
            upgrade.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        protocol_version:
          description: Protocol version that this genesis works with.
          format: uint32
          minimum: 0
          type: integer
        shard_layout:
          allOf:
            - $ref: '#/components/schemas/ShardLayout'
          default:
            V2:
              boundary_accounts: []
              id_to_index_map:
                '0': 0
              index_to_id_map:
                '0': 0
              shard_ids:
                - 0
              version: 0
          description: Layout information regarding how to split accounts to shards
        shuffle_shard_assignment_for_chunk_producers:
          default: false
          description: >-
            If true, shuffle the chunk producers across shards. In other words,
            if

            the shard assignments were `[S_0, S_1, S_2, S_3]` where `S_i`
            represents

            the set of chunk producers for shard `i`, if this flag were true,
            the

            shard assignments might become, for example, `[S_2, S_0, S_3, S_1]`.
          type: boolean
        target_validator_mandates_per_shard:
          default: 68
          description: Number of target chunk validator mandates for each shard.
          format: uint64
          minimum: 0
          type: integer
        total_supply:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Total supply of tokens at genesis.
        transaction_validity_period:
          description: Number of blocks for which a given transaction is valid
          format: uint64
          minimum: 0
          type: integer
        use_production_config:
          default: false
          description: >-
            This is only for test purposes. We hard code some configs for
            mainnet and testnet

            in AllEpochConfig, and we want to have a way to test that code path.
            This flag is for that.

            If set to true, the node will use the same config override path as
            mainnet and testnet.
          type: boolean
        validators:
          description: List of initial validators.
          items:
            $ref: '#/components/schemas/AccountInfo'
          type: array
      required:
        - protocol_version
        - genesis_time
        - chain_id
        - genesis_height
        - num_block_producer_seats
        - dynamic_resharding
        - epoch_length
        - gas_limit
        - min_gas_price
        - max_gas_price
        - block_producer_kickout_threshold
        - chunk_producer_kickout_threshold
        - gas_price_adjustment_rate
        - validators
        - transaction_validity_period
        - protocol_reward_rate
        - max_inflation_rate
        - total_supply
        - num_blocks_per_year
        - protocol_treasury_account
        - fishermen_threshold
      type: object
    ErrorWrapper_for_GenesisConfigError:
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
              $ref: '#/components/schemas/GenesisConfigError'
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
    NearToken:
      type: string
    NearGas:
      format: uint64
      minimum: 0
      type: integer
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
    ShardLayout:
      description: >-
        A versioned struct that contains all information needed to assign
        accounts to shards.


        Because of re-sharding, the chain may use different shard layout to
        split shards at different

        times. Currently, `ShardLayout` is stored as part of `EpochConfig`,
        which is generated each

        epoch given the epoch protocol version. In mainnet/testnet, we use two
        shard layouts since

        re-sharding has only happened once. It is stored as part of genesis
        config, see

        default_simple_nightshade_shard_layout() Below is an overview for some
        important

        functionalities of ShardLayout interface.
      oneOf:
        - additionalProperties: false
          properties:
            V0:
              $ref: '#/components/schemas/ShardLayoutV0'
          required:
            - V0
          type: object
        - additionalProperties: false
          properties:
            V1:
              $ref: '#/components/schemas/ShardLayoutV1'
          required:
            - V1
          type: object
        - additionalProperties: false
          properties:
            V2:
              $ref: '#/components/schemas/ShardLayoutV2'
          required:
            - V2
          type: object
        - additionalProperties: false
          properties:
            V3:
              $ref: '#/components/schemas/ShardLayoutV3'
          required:
            - V3
          type: object
    AccountInfo:
      description: Account info for validators
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        amount:
          $ref: '#/components/schemas/NearToken'
        public_key:
          $ref: '#/components/schemas/PublicKey'
      required:
        - account_id
        - public_key
        - amount
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
    GenesisConfigError:
      enum:
        - null
      nullable: true
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
    ShardLayoutV0:
      description: >-
        A shard layout that maps accounts evenly across all shards -- by
        calculate the hash of account

        id and mod number of shards. This is added to capture the old
        `account_id_to_shard_id` algorithm,

        to keep backward compatibility for some existing tests.

        `parent_shards` for `ShardLayoutV1` is always `None`, meaning it can
        only be the first shard layout

        a chain uses.
      properties:
        num_shards:
          description: Map accounts evenly across all shards
          format: uint64
          minimum: 0
          type: integer
        version:
          description: >-
            Version of the shard layout, this is useful for uniquely identify
            the shard layout
          format: uint32
          minimum: 0
          type: integer
      required:
        - num_shards
        - version
      type: object
    ShardLayoutV1:
      properties:
        boundary_accounts:
          description: |-
            The boundary accounts are the accounts on boundaries between shards.
            Each shard contains a range of accounts from one boundary account to
            another - or the smallest or largest account possible. The total
            number of shards is equal to the number of boundary accounts plus 1.
          items:
            $ref: '#/components/schemas/AccountId'
          type: array
        shards_split_map:
          description: >-
            Maps shards from the last shard layout to shards that it splits to
            in this shard layout,

            Useful for constructing states for the shards.

            None for the genesis shard layout
          items:
            items:
              $ref: '#/components/schemas/ShardId'
            type: array
          nullable: true
          type: array
        to_parent_shard_map:
          description: >-
            Maps shard in this shard layout to their parent shard

            Since shard_ids always range from 0 to num_shards - 1, we use vec
            instead of a hashmap
          items:
            $ref: '#/components/schemas/ShardId'
          nullable: true
          type: array
        version:
          description: >-
            Version of the shard layout, this is useful for uniquely identify
            the shard layout
          format: uint32
          minimum: 0
          type: integer
      required:
        - boundary_accounts
        - version
      type: object
    ShardLayoutV2:
      description: |-
        Counterpart to `ShardLayoutV2` composed of maps with string keys to aid
        serde serialization.
      properties:
        boundary_accounts:
          items:
            $ref: '#/components/schemas/AccountId'
          type: array
        id_to_index_map:
          additionalProperties:
            format: uint
            minimum: 0
            type: integer
          type: object
        index_to_id_map:
          additionalProperties:
            $ref: '#/components/schemas/ShardId'
          type: object
        shard_ids:
          items:
            $ref: '#/components/schemas/ShardId'
          type: array
        shards_parent_map:
          additionalProperties:
            $ref: '#/components/schemas/ShardId'
          nullable: true
          type: object
        shards_split_map:
          additionalProperties:
            items:
              $ref: '#/components/schemas/ShardId'
            type: array
          nullable: true
          type: object
        version:
          format: uint32
          minimum: 0
          type: integer
      required:
        - boundary_accounts
        - shard_ids
        - id_to_index_map
        - index_to_id_map
        - version
      type: object
    ShardLayoutV3:
      description: |-
        Counterpart to `ShardLayoutV3` composed of maps with string keys to aid
        serde serialization.
      properties:
        boundary_accounts:
          items:
            $ref: '#/components/schemas/AccountId'
          type: array
        id_to_index_map:
          additionalProperties:
            format: uint
            minimum: 0
            type: integer
          type: object
        last_split:
          $ref: '#/components/schemas/ShardId'
        shard_ids:
          items:
            $ref: '#/components/schemas/ShardId'
          type: array
        shards_split_map:
          additionalProperties:
            items:
              $ref: '#/components/schemas/ShardId'
            type: array
          type: object
      required:
        - boundary_accounts
        - shard_ids
        - id_to_index_map
        - shards_split_map
        - last_split
      type: object
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.