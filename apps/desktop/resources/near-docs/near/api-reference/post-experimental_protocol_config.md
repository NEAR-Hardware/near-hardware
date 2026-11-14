> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental protocol config

> A configuration that defines the protocol-level parameters such as gas/storage costs, limits, feature flags, other settings



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_protocol_config
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_protocol_config:
    post:
      description: >-
        A configuration that defines the protocol-level parameters such as
        gas/storage costs, limits, feature flags, other settings
      operationId: EXPERIMENTAL_protocol_config
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_protocol_config
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcProtocolConfigResponse_and_RpcProtocolConfigError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_protocol_config:
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
            - EXPERIMENTAL_protocol_config
          type: string
        params:
          $ref: '#/components/schemas/RpcProtocolConfigRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_protocol_config
      type: object
    JsonRpcResponse_for_RpcProtocolConfigResponse_and_RpcProtocolConfigError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcProtocolConfigResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcProtocolConfigError'
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
      title: JsonRpcResponse_for_RpcProtocolConfigResponse_and_RpcProtocolConfigError
      type: object
    RpcProtocolConfigRequest:
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
      title: RpcProtocolConfigRequest
      type: object
    RpcProtocolConfigResponse:
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
        chunk_producer_kickout_threshold:
          description: Threshold for kicking out chunk producers, between 0 and 100.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        chunk_validator_only_kickout_threshold:
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
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: Maximum gas price.
        max_inflation_rate:
          description: Maximum inflation on the total supply every epoch.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        max_kickout_stake_perc:
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
          description: >-
            The minimum stake required for staking is last seat price divided by
            this number.
          format: uint64
          minimum: 0
          type: integer
        minimum_stake_ratio:
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
        online_max_threshold:
          description: Online maximum threshold above which validator gets full reward.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        online_min_threshold:
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
          description: Current Protocol Version
          format: uint32
          minimum: 0
          type: integer
        runtime_config:
          allOf:
            - $ref: '#/components/schemas/RuntimeConfigView'
          description: Runtime configuration (mostly economics constants).
        shard_layout:
          allOf:
            - $ref: '#/components/schemas/ShardLayout'
          description: Layout information regarding how to split accounts to shards
        shuffle_shard_assignment_for_chunk_producers:
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
          description: Number of target chunk validator mandates for each shard.
          format: uint64
          minimum: 0
          type: integer
        transaction_validity_period:
          description: Number of blocks for which a given transaction is valid
          format: uint64
          minimum: 0
          type: integer
      type: object
    ErrorWrapper_for_RpcProtocolConfigError:
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
              $ref: '#/components/schemas/RpcProtocolConfigError'
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
    RuntimeConfigView:
      description: View that preserves JSON format of the runtime config.
      properties:
        account_creation_charge:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          default: '0'
          description: >-
            How much creating an account should cost in NEAR. Taken into account
            when burning gas for

            account creation.
        account_creation_config:
          allOf:
            - $ref: '#/components/schemas/AccountCreationConfigView'
          description: Config that defines rules for account creation.
        congestion_control_config:
          allOf:
            - $ref: '#/components/schemas/CongestionControlConfigView'
          description: The configuration for congestion control.
        min_gas_purchase_price:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          default: '0'
          description: >-
            Minimum price at which the gas attached to a receipt is purchased.
            The price at which it is

            burned might be lower, in which case the difference is refunded
            after execution.
        storage_amount_per_byte:
          allOf:
            - $ref: '#/components/schemas/NearToken'
          description: >-
            Amount of yN per byte required to have on the account.  See

            <https://nomicon.io/Economics/Economics.html#state-stake> for
            details.
        transaction_costs:
          allOf:
            - $ref: '#/components/schemas/RuntimeFeesConfigView'
          description: >-
            Costs of different actions that need to be performed when sending
            and

            processing transaction and receipts.
        wasm_config:
          allOf:
            - $ref: '#/components/schemas/VMConfigView'
          description: Config of wasm operations.
        witness_config:
          allOf:
            - $ref: '#/components/schemas/WitnessConfigView'
          description: Configuration specific to ChunkStateWitness.
      type: object
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
    RpcProtocolConfigError:
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
    AccountCreationConfigView:
      description: The structure describes configuration for creation of new accounts.
      properties:
        min_allowed_top_level_account_length:
          description: >-
            The minimum length of the top-level account ID that is allowed to be
            created by any account.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        registrar_account_id:
          allOf:
            - $ref: '#/components/schemas/AccountId'
          description: >-
            The account ID of the account registrar. This account ID allowed to
            create top-level

            accounts of any valid length.
      type: object
    CongestionControlConfigView:
      description: >-
        The configuration for congestion control. More info about congestion
        [here](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)
      properties:
        allowed_shard_outgoing_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            How much gas the chosen allowed shard can send to a 100% congested
            shard.


            See [`CongestionControlConfig`] for more details.
        max_congestion_incoming_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            How much gas in delayed receipts of a shard is 100% incoming
            congestion.


            See [`CongestionControlConfig`] for more details.
        max_congestion_memory_consumption:
          description: >-
            How much memory space of all delayed and buffered receipts in a
            shard is

            considered 100% congested.


            See [`CongestionControlConfig`] for more details.
          format: uint64
          minimum: 0
          type: integer
        max_congestion_missed_chunks:
          description: >-
            How many missed chunks in a row in a shard is considered 100%
            congested.
          format: uint64
          minimum: 0
          type: integer
        max_congestion_outgoing_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            How much gas in outgoing buffered receipts of a shard is 100%
            congested.


            Outgoing congestion contributes to overall congestion, which reduces
            how

            much other shards are allowed to forward to this shard.
        max_outgoing_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            The maximum amount of gas attached to receipts a shard can forward
            to

            another shard per chunk.


            See [`CongestionControlConfig`] for more details.
        max_tx_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            The maximum amount of gas in a chunk spent on converting new
            transactions to

            receipts.


            See [`CongestionControlConfig`] for more details.
        min_outgoing_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            The minimum gas each shard can send to a shard that is not fully
            congested.


            See [`CongestionControlConfig`] for more details.
        min_tx_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            The minimum amount of gas in a chunk spent on converting new
            transactions

            to receipts, as long as the receiving shard is not congested.


            See [`CongestionControlConfig`] for more details.
        reject_tx_congestion_threshold:
          description: >-
            How much congestion a shard can tolerate before it stops all shards
            from

            accepting new transactions with the receiver set to the congested
            shard.
          format: double
          type: number
      type: object
    RuntimeFeesConfigView:
      description: Describes different fees for the runtime
      properties:
        action_creation_config:
          allOf:
            - $ref: '#/components/schemas/ActionCreationConfigView'
          description: >-
            Describes the cost of creating a certain action, `Action`. Includes
            all variants.
        action_receipt_creation_config:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: >-
            Describes the cost of creating an action receipt, `ActionReceipt`,
            excluding the actual cost

            of actions.

            - `send` cost is burned when a receipt is created using
            `promise_create` or
                `promise_batch_create`
            - `exec` cost is burned when the receipt is being executed.
        burnt_gas_reward:
          description: >-
            Fraction of the burnt gas to reward to the contract account for
            execution.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        data_receipt_creation_config:
          allOf:
            - $ref: '#/components/schemas/DataReceiptCreationConfigView'
          description: Describes the cost of creating a data receipt, `DataReceipt`.
        ml_dsa_65_verification_cost:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Describes the extra cost of verifying an ML-DSA-65 signature above
            the

            cost of verifying the standard signature types.
        pessimistic_gas_price_inflation_ratio:
          description: Pessimistic gas price inflation ratio.
          items:
            format: int32
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        storage_usage_config:
          allOf:
            - $ref: '#/components/schemas/StorageUsageConfigView'
          description: Describes fees for storage.
      type: object
    VMConfigView:
      properties:
        bls12381_not_in_group_fix:
          description: >-
            See
            [VMConfig::bls12381_not_in_group_fix](crate::vm::Config::bls12381_not_in_group_fix).
          type: boolean
        ext_costs:
          allOf:
            - $ref: '#/components/schemas/ExtCostsConfigView'
          description: Costs for runtime externals
        fix_contract_loading_cost:
          description: >-
            See
            [VMConfig::fix_contract_loading_cost](crate::vm::Config::fix_contract_loading_cost).
          type: boolean
        grow_mem_cost:
          description: Gas cost of a growing memory by single page.
          format: uint32
          minimum: 0
          type: integer
        limit_config:
          allOf:
            - $ref: '#/components/schemas/LimitConfig'
          description: >-
            Describes limits for VM and Runtime.


            TODO: Consider changing this to `VMLimitConfigView` to avoid
            dependency

            on runtime.
        linear_op_base_cost:
          description: Base gas cost of a linear operation
          format: uint64
          minimum: 0
          type: integer
        linear_op_unit_cost:
          description: Unit gas cost of a linear operation
          format: uint64
          minimum: 0
          type: integer
        ml_dsa_verify_host_fn:
          description: >-
            See
            [VMConfig::ml_dsa_verify_host_fn](crate::vm::Config::ml_dsa_verify_host_fn).
          type: boolean
        regular_op_cost:
          description: Gas cost of a regular operation.
          format: uint32
          minimum: 0
          type: integer
        sha3_host_fns:
          description: See [VMConfig::sha3_host_fns](crate::vm::Config::sha3_host_fns).
          type: boolean
        universal_accounts:
          description: >-
            See
            [VMConfig::universal_accounts](crate::vm::Config::universal_accounts).
          type: boolean
        vm_kind:
          allOf:
            - $ref: '#/components/schemas/VMKind'
          description: See [VMConfig::vm_kind](crate::vm::Config::vm_kind).
      type: object
    WitnessConfigView:
      description: Configuration specific to ChunkStateWitness.
      properties:
        combined_transactions_size_limit:
          description: >-
            Maximum size of transactions contained inside ChunkStateWitness.


            A witness contains transactions from both the previous chunk and the
            current one.

            This parameter limits the sum of sizes of transactions from both of
            those chunks.
          format: uint
          minimum: 0
          type: integer
        main_storage_proof_size_soft_limit:
          description: >-
            Size limit for storage proof generated while executing receipts in a
            chunk.

            After this limit is reached we defer execution of any new receipts.
          format: uint64
          minimum: 0
          type: integer
        new_transactions_validation_state_size_soft_limit:
          description: >-
            Soft size limit of storage proof used to validate new transactions
            in ChunkStateWitness.
          format: uint64
          minimum: 0
          type: integer
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
    ActionCreationConfigView:
      description: >-
        Describes the cost of creating a specific action, `Action`. Includes all
        variants.
      properties:
        add_key_cost:
          allOf:
            - $ref: '#/components/schemas/AccessKeyCreationConfigView'
          description: Base cost of adding a key.
        create_account_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of creating an account.
        delegate_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: >-
            Base cost for processing a delegate action.


            This is on top of the costs for the actions inside the delegate
            action.
        delete_account_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of deleting an account.
        delete_key_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of deleting a key.
        deploy_contract_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of deploying a contract.
        deploy_contract_cost_per_byte:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Cost per byte of deploying a contract.
        function_call_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of calling a function.
        function_call_cost_per_byte:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Cost per byte of method name and arguments of calling a function.
        stake_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of staking.
        transfer_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of making a transfer.
      type: object
    Fee:
      description: >-
        Costs associated with an object that can only be sent over the network
        (and executed

        by the receiver).

        NOTE: `send_sir` or `send_not_sir` fees are usually burned when the item
        is being created.

        And `execution` fee is burned when the item is being executed.
      properties:
        execution:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Fee for executing the object.
        send_not_sir:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Fee for sending an object potentially across the shards.
        send_sir:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Fee for sending an object from the sender to itself, guaranteeing
            that it does not leave

            the shard.
      required:
        - send_sir
        - send_not_sir
        - execution
      type: object
    DataReceiptCreationConfigView:
      description: The fees settings for a data receipt creation
      properties:
        base_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: >-
            Base cost of creating a data receipt.

            Both `send` and `exec` costs are burned when a new receipt has input
            dependencies. The gas

            is charged for each input dependency. The dependencies are specified
            when a receipt is

            created using `promise_then` and `promise_batch_then`.

            NOTE: Any receipt with output dependencies will produce data
            receipts. Even if it fails.

            Even if the last action is not a function call (in case of success
            it will return empty

            value).
        cost_per_byte:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: >-
            Additional cost per byte sent.

            Both `send` and `exec` costs are burned when a function call
            finishes execution and returns

            `N` bytes of data to every output dependency. For each output
            dependency the cost is

            `(send(sir) + exec()) * N`.
      type: object
    StorageUsageConfigView:
      description: Describes cost of storage per block
      properties:
        num_bytes_account:
          description: >-
            Number of bytes for an account record, including rounding up for
            account id.
          format: uint64
          minimum: 0
          type: integer
        num_extra_bytes_record:
          description: Additional number of bytes for a k/v record
          format: uint64
          minimum: 0
          type: integer
      type: object
    ExtCostsConfigView:
      description: >-
        Typed view of ExtCostsConfig to preserve JSON output field names in
        protocol

        config RPC output.
      properties:
        alt_bn128_g1_multiexp_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for multiexp
        alt_bn128_g1_multiexp_element:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Per element cost for multiexp
        alt_bn128_g1_sum_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for sum
        alt_bn128_g1_sum_element:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Per element cost for sum
        alt_bn128_pairing_check_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for pairing check
        alt_bn128_pairing_check_element:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Per element cost for pairing check
        base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for calling a host function.
        bls12381_g1_multiexp_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_g1_multiexp_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_g2_multiexp_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_g2_multiexp_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_map_fp2_to_g2_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_map_fp2_to_g2_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_map_fp_to_g1_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_map_fp_to_g1_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_p1_decompress_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_p1_decompress_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_p1_sum_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_p1_sum_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_p2_decompress_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_p2_decompress_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_p2_sum_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_p2_sum_element:
          $ref: '#/components/schemas/NearGas'
        bls12381_pairing_base:
          $ref: '#/components/schemas/NearGas'
        bls12381_pairing_element:
          $ref: '#/components/schemas/NearGas'
        contract_loading_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost of loading a pre-compiled contract
        contract_loading_bytes:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost per byte of loading a pre-compiled contract
        ecrecover_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of calling ecrecover
        ed25519_verify_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting ed25519 base
        ed25519_verify_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting ed25519 per byte
        keccak256_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha256 base
        keccak256_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha256 per byte
        keccak512_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha256 base
        keccak512_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha256 per byte
        log_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for calling logging.
        log_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for logging per byte
        ml_dsa_verify_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of ML-DSA-65 signature verification base
        ml_dsa_verify_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of ML-DSA-65 signature verification per byte
        p256_verify_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of P-256 ECDSA signature verification base
        p256_verify_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of P-256 ECDSA signature verification per byte
        promise_and_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for calling `promise_and`
        promise_and_per_promise:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for calling `promise_and` for each promise
        promise_return:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for calling `promise_return`
        read_cached_trie_node:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for reading trie node from memory
        read_memory_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for guest memory read
        read_memory_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for guest memory read
        read_register_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for reading from register
        read_register_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for reading byte from register
        ripemd160_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting ripemd160 base
        ripemd160_block:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting ripemd160 per message block
        sha256_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha256 base
        sha256_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha256 per byte
        sha3_256_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha3-256 base
        sha3_256_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha3-256 per byte
        sha3_384_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha3-384 base
        sha3_384_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha3-384 per byte
        sha3_512_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha3-512 base
        sha3_512_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of getting sha3-512 per byte
        storage_has_key_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie check for key existence cost base
        storage_has_key_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie check for key existence per key byte
        storage_iter_create_from_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Create trie range iterator cost per byte of from key.
        storage_iter_create_prefix_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Create trie prefix iterator cost base
        storage_iter_create_prefix_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Create trie prefix iterator cost per byte.
        storage_iter_create_range_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Create trie range iterator cost base
        storage_iter_create_to_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Create trie range iterator cost per byte of to key.
        storage_iter_next_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Trie iterator per key base cost
        storage_iter_next_key_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Trie iterator next key byte cost
        storage_iter_next_value_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Trie iterator next key byte cost
        storage_large_read_overhead_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie read key overhead base cost, when doing large reads
        storage_large_read_overhead_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Storage trie read key overhead  per-byte cost, when doing large
            reads
        storage_read_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie read key base cost
        storage_read_key_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie read key per byte cost
        storage_read_value_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie read value cost per byte cost
        storage_remove_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Remove key from trie base cost
        storage_remove_key_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Remove key from trie per byte cost
        storage_remove_ret_value_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Remove key from trie ret value byte cost
        storage_write_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie write key base cost
        storage_write_evicted_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie write cost per byte of evicted value.
        storage_write_key_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie write key per byte cost
        storage_write_value_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Storage trie write value per byte cost
        touching_trie_node:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost per reading trie node from DB
        universal_state_init_to_account_id_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost of deriving a `0u` account id from a raw state init.
        universal_state_init_to_account_id_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Per byte of the raw state init.
        utf16_decoding_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost of decoding utf16. It's used for `log_utf16`.
        utf16_decoding_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost per byte of decoding utf16. It's used for `log_utf16`.
        utf8_decoding_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Base cost of decoding utf8. It's used for `log_utf8` and
            `panic_utf8`.
        utf8_decoding_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Cost per byte of decoding utf8. It's used for `log_utf8` and
            `panic_utf8`.
        validator_stake_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of calling `validator_stake`.
        validator_total_stake_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost of calling `validator_total_stake`.
        write_memory_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for guest memory write
        write_memory_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for guest memory write per byte
        write_register_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for writing into register
        write_register_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Cost for writing byte into register
        yield_create_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for creating a yield promise.
        yield_create_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Per byte cost of arguments and method name.
        yield_create_with_id_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Base cost for creating a yield promise with a user-provided yield ID

            (covers the additional trie writes for the yield_id<->data_id
            mapping).
        yield_resume_base:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Base cost for resuming a yield receipt.
        yield_resume_byte:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Per byte cost of resume payload.
      type: object
    LimitConfig:
      description: >-
        Describes limits for VM and Runtime.

        TODO #4139: consider switching to strongly-typed wrappers instead of raw
        quantities
      properties:
        initial_memory_pages:
          description: >-
            The initial number of memory pages.

            NOTE: It's not a limiter itself, but it's a value we use for
            initial_memory_pages.
          format: uint32
          minimum: 0
          type: integer
        max_actions_per_receipt:
          description: Max number of actions per receipt.
          format: uint64
          minimum: 0
          type: integer
        max_arguments_length:
          description: Max length of arguments in a function call action.
          format: uint64
          minimum: 0
          type: integer
        max_blocks_per_contract:
          description: >-
            If present, stores max total number of basic blocks across all
            functions in a contract.

            This caps total compilation time for a contract.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_blocks_per_function:
          description: >-
            If present, stores max number of basic blocks (block/loop/if) in a
            single function.

            This caps per-function compilation time in Cranelift.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_contract_size:
          description: Max contract size
          format: uint64
          minimum: 0
          type: integer
        max_deploy_actions_per_receipt:
          description: |-
            Max number of `DeployContract` and `DeployGlobalContract` actions
            combined within a single receipt.
          format: uint64
          minimum: 0
          type: integer
        max_elements_per_contract_table:
          description: >-
            If present, stores max number of elements in a single contract's
            table
          format: uint
          minimum: 0
          nullable: true
          type: integer
        max_function_body_size:
          description: >-
            If present, stores max byte size of a single function body in a
            contract
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_functions_number_per_contract:
          description: If present, stores max number of functions in one contract
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_gas_burnt:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: >-
            Max amount of gas that can be used, excluding gas attached to
            promises.
        max_gas_burnt_external:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: |-
            Max amount of gas that can be burnt by an external contract call,
            excluding gas attached to promises.
        max_globals_per_contract:
          description: |-
            If present, stores max number of globals (entries in the wasm global
            section) a contract may declare.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_instrumented_code_size:
          description: >-
            If present, stores max byte size of the wasm code after gas
            instrumentation.

            This prevents Cranelift's 24-bit SSA counter from overflowing on

            pathologically large contracts.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_length_method_name:
          description: Max length of any method name (without terminating character).
          format: uint64
          minimum: 0
          type: integer
        max_length_returned_data:
          description: Max length of returned data
          format: uint64
          minimum: 0
          type: integer
        max_length_storage_key:
          description: Max storage key size
          format: uint64
          minimum: 0
          type: integer
        max_length_storage_value:
          description: Max storage value size
          format: uint64
          minimum: 0
          type: integer
        max_locals_per_contract:
          description: >-
            If present, stores max number of locals declared globally in one
            contract
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_memory_pages:
          description: >-
            What is the maximal memory pages amount is allowed to have for a
            contract.
          format: uint32
          minimum: 0
          type: integer
        max_number_bytes_method_names:
          description: >-
            Max total length of all method names (including terminating
            character) for a function call

            permission access key.
          format: uint64
          minimum: 0
          type: integer
        max_number_input_data_dependencies:
          description: Max number of input data dependencies
          format: uint64
          minimum: 0
          type: integer
        max_number_logs:
          description: Maximum number of log entries.
          format: uint64
          minimum: 0
          type: integer
        max_number_registers:
          description: >-
            Maximum number of registers that can be used simultaneously.


            Note that due to an implementation quirk [read: a bug] in VMLogic,
            if we

            have this number of registers, no subsequent writes to the registers

            will succeed even if they replace an existing register.
          format: uint64
          minimum: 0
          type: integer
        max_operand_stack_bytes_per_function:
          description: >-
            If present, stores the max operand stack size (in bytes) at any
            point

            during the execution of a single function. Per-function: not summed

            across recursion. Computed by `finite_wasm::max_stack`.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_params_per_contract:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_params_per_function:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_promises_per_function_call_action:
          description: Max number of promises that a function call can create
          format: uint64
          minimum: 0
          type: integer
        max_receipt_size:
          description: Max receipt size
          format: uint64
          minimum: 0
          type: integer
        max_receipt_total_input_size:
          description: |-
            Max combined size (in bytes) of the resolved promise inputs a single
            receipt may consume.
          format: uint64
          minimum: 0
          type: integer
        max_register_size:
          description: Maximum number of bytes that can be stored in a single register.
          format: uint64
          minimum: 0
          type: integer
        max_stack_height:
          description: >-
            How tall the stack is allowed to grow?


            See <https://wiki.parity.io/WebAssembly-StackHeight> to find out how
            the stack frame cost

            is calculated.
          format: uint32
          minimum: 0
          type: integer
        max_state_init_entries:
          description: >-
            Max number of storage entries the `DeterministicStateInit` and

            `UniversalStateInit` actions in one receipt may carry, in total.


            Each entry costs `..._state_init_per_entry` to execute, which is
            counted

            into the receipt's congestion gas whether or not it is ever burnt.
            Without

            a cap one receipt reserves several times
            `max_congestion_outgoing_gas`,

            pinning the sending shard at full outgoing congestion, which stops
            it

            accepting transactions.
          format: uint64
          minimum: 0
          type: integer
        max_tables_per_contract:
          description: >-
            If present, stores max number of tables declared globally in one
            contract
          format: uint32
          minimum: 0
          nullable: true
          type: integer
        max_total_log_length:
          description: Maximum total length in bytes of all log messages.
          format: uint64
          minimum: 0
          type: integer
        max_total_prepaid_gas:
          allOf:
            - $ref: '#/components/schemas/NearGas'
          description: Max total prepaid gas for all function call actions per receipt.
        max_transaction_size:
          description: Max transaction size
          format: uint64
          minimum: 0
          type: integer
        max_types_per_contract:
          description: >-
            If present, stores max number of entries in the wasm type section
            that

            a contract may declare.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        max_universal_state_init_keys:
          description: >-
            Max number of access keys the `UniversalStateInit` actions in one
            receipt

            may commit to, in total.


            Each committed key is priced as a full `AddKey`, at the send rate,
            so the

            whole cost lands when a transaction is converted to a receipt.
            Without a

            cap one transaction converts for more gas than a chunk has, and
            since

            conversion happens before anything is charged, transaction selection

            admits it anyway. The bound is per receipt because a receipt can
            carry

            many byte-identical copies of a state init and pays for each of
            them.
          format: uint64
          minimum: 0
          type: integer
        max_yield_payload_size:
          description: Maximum number of bytes for payload passed over a yield resume.
          format: uint64
          minimum: 0
          type: integer
        min_contract_size_per_local:
          description: >-
            If present, requires at least this many bytes of contract code per
            local.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        per_receipt_storage_proof_size_limit:
          description: >-
            Hard limit on the size of storage proof generated while executing a
            single receipt.
          format: uint
          minimum: 0
          type: integer
        registers_memory_limit:
          description: Limit of memory used by registers.
          format: uint64
          minimum: 0
          type: integer
        yield_timeout_length_in_blocks:
          description: Number of blocks after which a yielded promise times out.
          format: uint64
          minimum: 0
          type: integer
      type: object
    VMKind:
      oneOf:
        - description: Wasmer 0.17.x VM. Gone now.
          enum:
            - Wasmer0
          type: string
        - description: Wasmtime VM.
          enum:
            - Wasmtime
          type: string
        - description: Wasmer 2.x VM.
          enum:
            - Wasmer2
          type: string
        - description: NearVM.
          enum:
            - NearVm
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
    AccessKeyCreationConfigView:
      description: Describes the cost of creating an access key.
      properties:
        full_access_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Base cost of creating a full access access-key.
        function_call_cost:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: >-
            Base cost of creating an access-key restricted to specific
            functions.
        function_call_cost_per_byte:
          allOf:
            - $ref: '#/components/schemas/Fee'
          description: Cost per byte of method_names of creating a restricted access-key.
      required:
        - full_access_cost
        - function_call_cost
        - function_call_cost_per_byte
      type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.