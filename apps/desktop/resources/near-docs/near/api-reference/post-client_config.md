> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post client config

> Queries client node configuration



## OpenAPI

````yaml /openapi.json post /client_config
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /client_config:
    post:
      description: Queries client node configuration
      operationId: client_config
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_client_config'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcClientConfigResponse_and_RpcClientConfigError
components:
  schemas:
    JsonRpcRequest_for_client_config:
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
            - client_config
          type: string
        params:
          $ref: '#/components/schemas/RpcClientConfigRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_client_config
      type: object
    JsonRpcResponse_for_RpcClientConfigResponse_and_RpcClientConfigError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcClientConfigResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcClientConfigError'
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
      title: JsonRpcResponse_for_RpcClientConfigResponse_and_RpcClientConfigError
      type: object
    RpcClientConfigRequest:
      enum:
        - null
      nullable: true
      title: RpcClientConfigRequest
    RpcClientConfigResponse:
      description: ClientConfig where some fields can be updated at runtime.
      properties:
        archive:
          description: Not clear old data, set `true` for archive nodes.
          type: boolean
        block_header_fetch_horizon:
          description: Behind this horizon header fetch kicks in.
          format: uint64
          minimum: 0
          type: integer
        block_production_tracking_delay:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Duration to check for producing / skipping block.
        block_request_timeout:
          description: How long to wait for a state sync block request response
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        catchup_step_period:
          description: Time between check to perform catchup.
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        chain_id:
          description: Chain id for status.
          type: string
        chunk_distribution_network:
          anyOf:
            - $ref: '#/components/schemas/ChunkDistributionNetworkConfig'
            - enum:
                - null
              nullable: true
          description: >-
            Optional config for the Chunk Distribution Network feature.

            If set to `None` then this node does not participate in the Chunk
            Distribution Network.

            Nodes not participating will still function fine, but possibly with
            higher

            latency due to the need of requesting chunks over the peer-to-peer
            network.
        chunk_request_retry_period:
          description: Time between checking to re-request chunks.
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        chunk_validation_threads:
          description: Number of threads for ChunkValidationActor pool.
          format: uint
          minimum: 0
          type: integer
        chunk_wait_mult:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Multiplier for the wait time for all chunks to be received.
        chunks_cache_height_horizon:
          description: >-
            Height horizon for the chunk cache. A chunk is removed from the
            cache

            if its height + chunks_cache_height_horizon < largest_seen_height.

            The default value is given by default_chunks_cache_height_horizon().
          format: uint64
          minimum: 0
          type: integer
        client_background_migration_threads:
          description: Number of threads to execute background migration work in client.
          format: uint
          minimum: 0
          type: integer
        cloud_archival_writer:
          anyOf:
            - $ref: '#/components/schemas/CloudArchivalWriterConfig'
            - enum:
                - null
              nullable: true
          description: >-
            Configuration for a cloud-based archival writer. If this config is
            present, the writer is enabled and

            writes chunk-related data based on the tracked shards.
        disable_tx_routing:
          description: >-
            If true, the node won't forward transactions to next the chunk
            producers.
          type: boolean
        doomslug_step_period:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Time between running doomslug timer.
        enable_early_prepare_transactions:
          description: >-
            If true, transactions for the next chunk will be prepared early,
            right after the previous chunk's

            post-state is ready. This can help produce chunks faster, for
            high-throughput chains.

            The current implementation increases latency on low-load chains,
            which will be fixed in the future.

            The default is disabled.
          type: boolean
        enable_multiline_logging:
          type: boolean
        enable_statistics_export:
          description: Re-export storage layer statistics as prometheus metrics.
          type: boolean
        epoch_length:
          description: Epoch length.
          format: uint64
          minimum: 0
          type: integer
        epoch_sync:
          allOf:
            - $ref: '#/components/schemas/EpochSyncConfig'
          description: Options for epoch sync.
        expected_shutdown:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Graceful shutdown at expected block height.
        gc:
          allOf:
            - $ref: '#/components/schemas/GCConfig'
          description: Garbage collection configuration.
        header_sync_expected_height_per_second:
          description: >-
            Expected increase of header head height per second during header
            sync
          format: uint64
          minimum: 0
          type: integer
        header_sync_initial_timeout:
          description: How much time to wait after initial header sync
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        header_sync_progress_timeout:
          description: How much time to wait after some progress is made in header sync
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        header_sync_stall_ban_timeout:
          description: >-
            How much time to wait before banning a peer in header sync if sync
            is too slow
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        log_summary_period:
          description: Period between logging summary information.
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        log_summary_style:
          allOf:
            - $ref: '#/components/schemas/LogSummaryStyle'
          description: Enable coloring of the logs
        max_block_production_delay:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Maximum wait for approvals before producing block.
        max_block_wait_delay:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Maximum duration before skipping given height.
        max_gas_burnt_view:
          anyOf:
            - $ref: '#/components/schemas/NearGas'
            - enum:
                - null
              nullable: true
          description: >-
            Max burnt gas per view method.  If present, overrides value stored
            in

            genesis file.  The value only affects the RPCs without influencing
            the

            protocol thus changing it per-node doesn’t affect the blockchain.
        min_block_production_delay:
          allOf:
            - $ref: '#/components/schemas/MutableConfigValue'
          description: Minimum duration before producing block.
        min_num_peers:
          description: Minimum number of peers to start syncing.
          format: uint
          minimum: 0
          type: integer
        num_block_producer_seats:
          description: Number of block producer seats
          format: uint64
          minimum: 0
          type: integer
        orphan_state_witness_max_size:
          description: |-
            Maximum size of state witnesses in the OrphanStateWitnessPool.

            We keep only orphan witnesses which are smaller than this size.
            This limits the maximum memory usage of OrphanStateWitnessPool.
          format: uint64
          minimum: 0
          type: integer
        orphan_state_witness_pool_size:
          description: >-
            OrphanStateWitnessPool keeps instances of ChunkStateWitness which
            can't be processed

            because the previous block isn't available. The witnesses wait in
            the pool until the

            required block appears. This variable controls how many witnesses
            can be stored in the pool.
          format: uint
          minimum: 0
          type: integer
        produce_chunk_add_transactions_time_limit:
          description: >-
            Limit the time of adding transactions to a chunk.

            A node produces a chunk by adding transactions from the transaction
            pool until

            some limit is reached. This time limit ensures that adding
            transactions won't take

            longer than the specified duration, which helps to produce the chunk
            quickly.
          type: string
        produce_empty_blocks:
          description: Produce empty blocks, use `false` for testing.
          type: boolean
        protocol_version_check:
          allOf:
            - $ref: '#/components/schemas/ProtocolVersionCheckConfig'
          description: >-
            Determines whether client should exit if the protocol version is not
            supported

            for the next or next next epoch.
        receipt_to_tx_max_hint_window:
          description: |-
            Max `±window` accepted on `EXPERIMENTAL_receipt_to_tx` requests.
            Caps caller's `window`. Applies to pre-first-scan `CenterOut`
            against caller's literal hint; ancestor scans use
            `receipt_to_tx_max_hop_distance` instead. Operators raising this
            should also raise `receipt_to_tx_max_hop_distance` so backward reach
            matches caller's wider hint scope. Requests with `window` over this
            rejected with `WindowTooLarge`.
          format: uint64
          minimum: 0
          type: integer
        receipt_to_tx_max_hop_distance:
          description: |-
            Max block-distance ancestor scan walks per hop once any scan in
            walk refreshed `current_height`. Subsequent column-miss scans visit
            `h, h-1, ..., h-max_hop_distance` from most-recent scan-refreshed
            anchor, regardless of column hits between. Anchor included —
            same-shard local receipts execute in same block as producing
            outcome. Raise if cold archival traffic shows ancestor misses —
            gap = scan-refreshed anchor to producer-outcome height of receipt
            with missing column row (column hits don't reset anchor). Default
            20 (matches `receipt_to_tx_max_hint_window`).
          format: uint64
          minimum: 0
          type: integer
        receipt_to_tx_max_outcomes_per_request:
          description: |-
            Per-request ceiling on outcome rows the `EXPERIMENTAL_receipt_to_tx`
            hint-fallback scanner reads across hops + shards. Caps cold-RocksDB
            worst case on unauthenticated public endpoint. Default 20_000.
            Operators serving cold archival traffic with deep walks or sparse
            outcomes may raise; benchmark first (see TODO in
            `view_client_actor.rs`). Mid-scan exhaustion fails with
            `BudgetExceeded { scanned, limit }`.
          format: uint64
          minimum: 0
          type: integer
        resharding_config:
          $ref: '#/components/schemas/MutableConfigValue'
        rpc_addr:
          description: Listening rpc port for status.
          nullable: true
          type: string
        save_invalid_witnesses:
          description: >-
            Save observed instances of invalid ChunkStateWitness to the database
            in DBCol::InvalidChunkStateWitnesses.

            Saving invalid witnesses is useful for analysis and debugging.

            This option can cause extra load on the database and is not
            recommended for production use.
          type: boolean
        save_latest_witnesses:
          description: >-
            Save observed instances of ChunkStateWitness to the database in
            DBCol::LatestChunkStateWitnesses.

            Saving the latest witnesses is useful for analysis and debugging.

            This option can cause extra load on the database and is not
            recommended for production use.
          type: boolean
        save_receipt_to_tx:
          description: Whether to persist receipt-to-tx origin mappings to disk or not.
          type: boolean
        save_state_changes:
          description: Whether to persist state changes on disk or not.
          type: boolean
        save_trie_changes:
          description: >-
            save_trie_changes should be set to true iff

            - archive if false - non-archival nodes need trie changes to perform
            garbage collection

            - archive is true, cold_store is configured and migration to
            split_storage is finished - node

            working in split storage mode needs trie changes in order to do
            garbage collection on hot.
          type: boolean
        save_tx_outcomes:
          description: Whether to persist transaction outcomes to disk or not.
          type: boolean
        save_untracked_partial_chunks_parts:
          description: Whether to persist partial chunk parts for untracked shards or not.
          type: boolean
        skip_sync_wait:
          description: Skip waiting for sync (for testing or single node testnet).
          type: boolean
        state_request_server_threads:
          description: Number of threads for StateRequestActor pool.
          format: uint
          minimum: 0
          type: integer
        state_request_throttle_period:
          description: |-
            Number of seconds between state requests for view client.
            Throttling window for state requests (headers and parts).
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        state_requests_per_throttle_period:
          description: Maximum number of state requests served per throttle period
          format: uint
          minimum: 0
          type: integer
        state_sync:
          allOf:
            - $ref: '#/components/schemas/StateSyncConfig'
          description: Options for syncing state.
        state_sync_p2p_timeout:
          description: How long to wait for a response from p2p state sync
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        state_sync_retry_backoff:
          description: How long to wait after a failed state sync request
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        sync_check_period:
          description: How often to check that we are not out of sync.
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        sync_height_threshold:
          description: >-
            Sync height threshold: below this difference in height don't start
            syncing.
          format: uint64
          minimum: 0
          type: integer
        sync_max_block_requests:
          description: Maximum number of block requests to send to peers to sync
          format: uint
          minimum: 0
          type: integer
        sync_step_period:
          description: While syncing, how long to check for each step.
          items:
            format: uint64
            minimum: 0
            type: integer
          maxItems: 2
          minItems: 2
          type: array
        tracked_shards_config:
          $ref: '#/components/schemas/TrackedShardsConfig'
        transaction_pool_size_limit:
          description: >-
            Limit of the size of per-shard transaction pool measured in bytes.
            If not set, the size

            will be unbounded.
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        transaction_pool_strict_nonce_ttl_blocks:
          description: >-
            TTL in blocks for gapped strict-nonce transactions in the pool.
            Transactions with a

            nonce gap whose block_hash is older than this many blocks are
            evicted during

            prepare_transactions.
          format: uint64
          minimum: 0
          type: integer
        transaction_request_handler_threads:
          format: uint
          minimum: 0
          type: integer
        trie_viewer_state_size_limit:
          description: >-
            Upper bound of the byte size of contract state that is still
            viewable. None is no limit
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        tx_routing_height_horizon:
          description: >-
            If the node is not a chunk producer within that many blocks, then
            route

            to upcoming chunk producers.
          format: uint64
          minimum: 0
          type: integer
        version:
          allOf:
            - $ref: '#/components/schemas/Version'
          description: Version of the binary.
        view_access_keys_limit:
          description: >-
            Upper bound on the number of access keys returned by a
            `view_access_key_list`

            query.
          format: uint32
          minimum: 0
          type: integer
        view_client_threads:
          description: Number of threads for ViewClientActor pool.
          format: uint
          minimum: 0
          type: integer
      type: object
    ErrorWrapper_for_RpcClientConfigError:
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
              $ref: '#/components/schemas/RpcClientConfigError'
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
    MutableConfigValue:
      type: string
    ChunkDistributionNetworkConfig:
      description: >-
        Config for the Chunk Distribution Network feature.

        This allows nodes to push and pull chunks from a central stream.

        The two benefits of this approach are: (1) less request/response traffic

        on the peer-to-peer network and (2) lower latency for RPC nodes indexing
        the chain.
      properties:
        enabled:
          type: boolean
        uris:
          $ref: '#/components/schemas/ChunkDistributionUris'
      type: object
    CloudArchivalWriterConfig:
      description: >-
        Configuration for a cloud-based archival writer. If this config is
        present, the writer is enabled and

        writes chunk-related data based on the tracked shards. This config also
        controls additional archival

        behavior such as block data and polling interval.
      properties:
        archive_block_data:
          default: false
          description: >-
            Determines whether block-related data should be written to cloud
            storage.
          type: boolean
        catch_up_throttle:
          allOf:
            - $ref: '#/components/schemas/DurationAsStdSchemaProvider'
          default:
            nanos: 100000000
            secs: 1
          description: >-
            Delay between consecutive batches while the writer is catching up,
            pacing

            how fast it uploads to the storage backend.
        polling_interval:
          allOf:
            - $ref: '#/components/schemas/DurationAsStdSchemaProvider'
          default:
            nanos: 0
            secs: 5
          description: >-
            Interval at which the system checks for new blocks or chunks to
            archive.
        snapshot_every_n_epochs:
          default: 10
          description: >-
            Cadence of state snapshots, in epochs. Higher values reduce bucket
            cost at

            the expense of potentially longer delta replay during reader
            bootstrap.
          format: uint64
          minimum: 0
          type: integer
      type: object
    EpochSyncConfig:
      properties:
        epoch_sync_horizon_num_epochs:
          default: 2
          description: >-
            Number of epochs behind the network head beyond which the node will
            use

            epoch sync instead of header sync. At the consumption site, this is

            multiplied by epoch_length to get the horizon in blocks.
          format: uint64
          minimum: 0
          type: integer
        timeout_for_epoch_sync:
          allOf:
            - $ref: '#/components/schemas/DurationAsStdSchemaProvider'
          description: >-
            Timeout for epoch sync requests. The node will continue retrying
            indefinitely even

            if this timeout is exceeded.
      type: object
    GCConfig:
      description: Configuration for garbage collection.
      properties:
        gc_blocks_limit:
          default: 2
          description: >-
            Maximum number of blocks to garbage collect at every garbage
            collection

            call.
          format: uint64
          minimum: 0
          type: integer
        gc_fork_clean_step:
          default: 100
          description: >-
            Maximum number of height to go through at each garbage collection
            step

            when cleaning forks during garbage collection.
          format: uint64
          minimum: 0
          type: integer
        gc_num_epochs_to_keep:
          default: 5
          description: Number of epochs for which we keep store data.
          format: uint64
          minimum: 0
          type: integer
        gc_step_period:
          allOf:
            - $ref: '#/components/schemas/DurationAsStdSchemaProvider'
          default:
            nanos: 500000000
            secs: 0
          description: How often gc should be run
      type: object
    LogSummaryStyle:
      enum:
        - plain
        - colored
      type: string
    NearGas:
      format: uint64
      minimum: 0
      type: integer
    ProtocolVersionCheckConfig:
      description: >-
        Configures whether the node checks the next or the next next epoch for
        network version compatibility.
      enum:
        - Next
        - NextNext
      type: string
    StateSyncConfig:
      properties:
        concurrency:
          $ref: '#/components/schemas/SyncConcurrency'
        dump:
          anyOf:
            - $ref: '#/components/schemas/DumpConfig'
            - enum:
                - null
              nullable: true
          description: '`none` value disables state dump to external storage.'
        parts_compression_lvl:
          default: 1
          description: Zstd compression level for state parts.
          format: int32
          type: integer
        sync:
          $ref: '#/components/schemas/SyncConfig'
      type: object
    TrackedShardsConfig:
      description: >-
        Describes the expected behavior of the node regarding shard tracking.

        If the node is an active validator, it will also track the shards it is
        responsible for as a validator.
      oneOf:
        - description: Tracks no shards (light client).
          enum:
            - NoShards
          type: string
        - additionalProperties: false
          description: Tracks arbitrary shards.
          properties:
            Shards:
              items:
                $ref: '#/components/schemas/ShardUId'
              type: array
          required:
            - Shards
          type: object
        - description: Tracks all shards.
          enum:
            - AllShards
          type: string
        - additionalProperties: false
          description: Tracks shards that are assigned to given validator account.
          properties:
            ShadowValidator:
              $ref: '#/components/schemas/AccountId'
          required:
            - ShadowValidator
          type: object
        - additionalProperties: false
          description: >-
            Rotate between these sets of tracked shards.

            Used to simulate the behavior of chunk only producers without
            staking tokens.
          properties:
            Schedule:
              items:
                items:
                  $ref: '#/components/schemas/ShardId'
                type: array
              type: array
          required:
            - Schedule
          type: object
        - additionalProperties: false
          description: Tracks shards that contain one of the given account.
          properties:
            Accounts:
              items:
                $ref: '#/components/schemas/AccountId'
              type: array
          required:
            - Accounts
          type: object
    Version:
      description: Data structure for semver version and github tag or commit.
      properties:
        build:
          type: string
        commit:
          type: string
        rustc_version:
          default: ''
          type: string
        version:
          type: string
      required:
        - version
        - build
        - commit
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
    RpcClientConfigError:
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
    ChunkDistributionUris:
      description: URIs for the Chunk Distribution Network feature.
      properties:
        get:
          description: URI for pulling chunks from the stream.
          type: string
        set:
          description: URI for publishing chunks to the stream.
          type: string
      type: object
    DurationAsStdSchemaProvider:
      properties:
        nanos:
          format: int32
          type: integer
        secs:
          format: int64
          type: integer
      required:
        - secs
        - nanos
      type: object
    SyncConcurrency:
      properties:
        apply:
          description: >-
            Maximum number of "apply parts" tasks that can be performed in
            parallel.

            This is a very disk-heavy task and therefore we set this to a low
            limit,

            or else the rocksdb contention makes the whole server freeze up.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        apply_during_catchup:
          description: >-
            Maximum number of "apply parts" tasks that can be performed in
            parallel

            during catchup. We set this to a very low value to avoid overloading
            the

            node while it is still performing normal tasks.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        peer_downloads:
          description: Maximum number of outstanding requests for decentralized state sync.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
        per_shard:
          description: >-
            The maximum parallelism to use per shard. This is mostly for
            fairness, because

            the actual rate limiting is done by the TaskTrackers, but this is
            useful for

            balancing the shards a little.
          format: uint8
          maximum: 255
          minimum: 0
          type: integer
      type: object
    DumpConfig:
      description: Configures how to dump state to external storage.
      properties:
        credentials_file:
          description: >-
            Location of a json file with credentials allowing access to the
            bucket.
          nullable: true
          type: string
        iteration_delay:
          anyOf:
            - $ref: '#/components/schemas/DurationAsStdSchemaProvider'
            - enum:
                - null
              nullable: true
          description: |-
            How often to check if a new epoch has started.
            Feel free to set to `None`, defaults are sensible.
        location:
          allOf:
            - $ref: '#/components/schemas/ExternalStorageLocation'
          description: Specifies where to write the obtained state parts.
        restart_dump_for_shards:
          description: |-
            Use in case a node that dumps state to the external storage
            gets in trouble.
          items:
            $ref: '#/components/schemas/ShardId'
          nullable: true
          type: array
      type: object
    SyncConfig:
      description: Configures how to fetch state parts during state sync.
      oneOf:
        - description: >-
            Syncs state from the peers without reading anything from external
            storage.
          enum:
            - Peers
          type: string
    ShardUId:
      description: >-
        `ShardUId` is a unique representation for shards from different shard
        layouts.


        Comparing to `ShardId`, which is just an ordinal number ranging from 0
        to NUM_SHARDS-1,

        `ShardUId` provides a way to unique identify shards when shard layouts
        may change across epochs.

        This is important because we store states indexed by shards in our
        database, so we need a

        way to unique identify shard even when shards change across epochs.

        Another difference between `ShardUId` and `ShardId` is that `ShardUId`
        should only exist in

        a node's internal state while `ShardId` can be exposed to outside APIs
        and used in protocol

        level information (for example, `ShardChunkHeader` contains `ShardId`
        instead of `ShardUId`)
      properties:
        shard_id:
          format: uint32
          minimum: 0
          type: integer
        version:
          format: uint32
          minimum: 0
          type: integer
      required:
        - version
        - shard_id
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
    ExternalStorageLocation:
      description: Supported external storage backends and their minimal config.
      oneOf:
        - additionalProperties: false
          properties:
            S3:
              properties:
                bucket:
                  description: Location on S3.
                  type: string
                region:
                  description: Data may only be available in certain locations.
                  type: string
              required:
                - bucket
                - region
              type: object
          required:
            - S3
          type: object
        - additionalProperties: false
          description: Local filesystem root for storing data.
          properties:
            Filesystem:
              properties:
                root_dir:
                  type: string
              required:
                - root_dir
              type: object
          required:
            - Filesystem
          type: object
        - additionalProperties: false
          description: Google Cloud Storage bucket name.
          properties:
            GCS:
              properties:
                bucket:
                  type: string
              required:
                - bucket
              type: object
          required:
            - GCS
          type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.