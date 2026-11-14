> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post status

> Requests the status of the connected RPC node. This includes information about sync status, nearcore node version, protocol version, the current set of validators, etc.



## OpenAPI

````yaml /openapi.json post /status
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /status:
    post:
      description: >-
        Requests the status of the connected RPC node. This includes information
        about sync status, nearcore node version, protocol version, the current
        set of validators, etc.
      operationId: status
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_status'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcStatusResponse_and_RpcStatusError
components:
  schemas:
    JsonRpcRequest_for_status:
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
            - status
          type: string
        params:
          $ref: '#/components/schemas/RpcStatusRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_status
      type: object
    JsonRpcResponse_for_RpcStatusResponse_and_RpcStatusError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcStatusResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcStatusError'
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
      title: JsonRpcResponse_for_RpcStatusResponse_and_RpcStatusError
      type: object
    RpcStatusRequest:
      enum:
        - null
      nullable: true
      title: RpcStatusRequest
    RpcStatusResponse:
      properties:
        chain_id:
          description: Unique chain id.
          type: string
        detailed_debug_status:
          anyOf:
            - $ref: '#/components/schemas/DetailedDebugStatus'
            - enum:
                - null
              nullable: true
          description: >-
            Information about last blocks, network, epoch and chain & chunk
            info.
        genesis_hash:
          allOf:
            - $ref: '#/components/schemas/CryptoHash'
          description: Genesis hash of the chain.
        latest_protocol_version:
          description: Latest protocol version that this client supports.
          format: uint32
          minimum: 0
          type: integer
        node_key:
          anyOf:
            - $ref: '#/components/schemas/PublicKey'
            - enum:
                - null
              nullable: true
          description: >-
            Deprecated; same as `validator_public_key` which you should use
            instead.
        node_public_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: Public key of the node.
        protocol_version:
          description: Currently active protocol version.
          format: uint32
          minimum: 0
          type: integer
        rpc_addr:
          description: >-
            Address for RPC server.  None if node doesn't have RPC endpoint
            enabled.
          nullable: true
          type: string
        sync_info:
          allOf:
            - $ref: '#/components/schemas/StatusSyncInfo'
          description: Sync status of the node.
        uptime_sec:
          description: Uptime of the node.
          format: int64
          type: integer
        validator_account_id:
          anyOf:
            - $ref: '#/components/schemas/AccountId'
            - enum:
                - null
              nullable: true
          description: Validator id of the node
        validator_public_key:
          anyOf:
            - $ref: '#/components/schemas/PublicKey'
            - enum:
                - null
              nullable: true
          description: Public key of the validator.
        validators:
          description: Current epoch validators.
          items:
            $ref: '#/components/schemas/ValidatorInfo'
          type: array
        version:
          allOf:
            - $ref: '#/components/schemas/Version'
          description: Binary version.
      required:
        - version
        - chain_id
        - protocol_version
        - latest_protocol_version
        - validators
        - sync_info
        - node_public_key
        - uptime_sec
        - genesis_hash
      type: object
    ErrorWrapper_for_RpcStatusError:
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
              $ref: '#/components/schemas/RpcStatusError'
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
    DetailedDebugStatus:
      properties:
        block_production_delay_millis:
          format: uint64
          minimum: 0
          type: integer
        catchup_status:
          items:
            $ref: '#/components/schemas/CatchupStatusView'
          type: array
        current_head_status:
          $ref: '#/components/schemas/BlockStatusView'
        current_header_head_status:
          $ref: '#/components/schemas/BlockStatusView'
        network_info:
          $ref: '#/components/schemas/NetworkInfoView'
        sync_status:
          type: string
      required:
        - network_info
        - sync_status
        - catchup_status
        - current_head_status
        - current_header_head_status
        - block_production_delay_millis
      type: object
    CryptoHash:
      type: string
    PublicKey:
      type: string
    StatusSyncInfo:
      properties:
        earliest_block_hash:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
        earliest_block_height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        earliest_block_time:
          nullable: true
          type: string
        epoch_id:
          anyOf:
            - $ref: '#/components/schemas/EpochId'
            - enum:
                - null
              nullable: true
        epoch_start_height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        latest_block_hash:
          $ref: '#/components/schemas/CryptoHash'
        latest_block_height:
          format: uint64
          minimum: 0
          type: integer
        latest_block_time:
          type: string
        latest_state_root:
          $ref: '#/components/schemas/CryptoHash'
        syncing:
          type: boolean
      required:
        - latest_block_hash
        - latest_block_height
        - latest_state_root
        - latest_block_time
        - syncing
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
    ValidatorInfo:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
      required:
        - account_id
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
    RpcStatusError:
      oneOf:
        - properties:
            name:
              enum:
                - NODE_IS_SYNCING
              type: string
          required:
            - name
          type: object
        - properties:
            info:
              properties:
                elapsed:
                  items:
                    format: uint64
                    minimum: 0
                    type: integer
                  maxItems: 2
                  minItems: 2
                  type: array
              required:
                - elapsed
              type: object
            name:
              enum:
                - NO_NEW_BLOCKS
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                epoch_id:
                  $ref: '#/components/schemas/EpochId'
              required:
                - epoch_id
              type: object
            name:
              enum:
                - EPOCH_OUT_OF_BOUNDS
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
    CatchupStatusView:
      description: >-
        Status of the
        [catchup](https://near.github.io/nearcore/architecture/how/sync.html#catchup)
        process
      properties:
        blocks_to_catchup:
          items:
            $ref: '#/components/schemas/BlockStatusView'
          type: array
        shard_sync_status:
          additionalProperties:
            type: string
          type: object
          description: 'Object keys must match: `^\d+$`.'
        sync_block_hash:
          $ref: '#/components/schemas/CryptoHash'
        sync_block_height:
          format: uint64
          minimum: 0
          type: integer
      required:
        - sync_block_hash
        - sync_block_height
        - shard_sync_status
        - blocks_to_catchup
      type: object
    BlockStatusView:
      description: Height and hash of a block
      properties:
        hash:
          $ref: '#/components/schemas/CryptoHash'
        height:
          format: uint64
          minimum: 0
          type: integer
      required:
        - height
        - hash
      type: object
    NetworkInfoView:
      properties:
        connected_peers:
          items:
            $ref: '#/components/schemas/PeerInfoView'
          type: array
        known_producers:
          items:
            $ref: '#/components/schemas/KnownProducerView'
          type: array
        num_connected_peers:
          format: uint
          minimum: 0
          type: integer
        peer_max_count:
          format: uint32
          minimum: 0
          type: integer
        tier1_accounts_data:
          items:
            $ref: '#/components/schemas/AccountDataView'
          type: array
        tier1_accounts_keys:
          items:
            $ref: '#/components/schemas/PublicKey'
          type: array
        tier1_connections:
          items:
            $ref: '#/components/schemas/PeerInfoView'
          type: array
      required:
        - peer_max_count
        - num_connected_peers
        - connected_peers
        - known_producers
        - tier1_accounts_keys
        - tier1_accounts_data
        - tier1_connections
      type: object
    EpochId:
      allOf:
        - $ref: '#/components/schemas/CryptoHash'
      description: |-
        Epoch identifier -- wrapped hash, to make it easier to distinguish.
        EpochId of epoch T is the hash of last block in T-2
        EpochId of first two epochs is 0
    PeerInfoView:
      properties:
        account_id:
          anyOf:
            - $ref: '#/components/schemas/AccountId'
            - enum:
                - null
              nullable: true
        addr:
          type: string
        archival:
          type: boolean
        block_hash:
          anyOf:
            - $ref: '#/components/schemas/CryptoHash'
            - enum:
                - null
              nullable: true
        connection_established_time_millis:
          format: uint64
          minimum: 0
          type: integer
        height:
          format: uint64
          minimum: 0
          nullable: true
          type: integer
        is_highest_block_invalid:
          type: boolean
        is_outbound_peer:
          type: boolean
        last_time_peer_requested_millis:
          format: uint64
          minimum: 0
          type: integer
        last_time_received_message_millis:
          format: uint64
          minimum: 0
          type: integer
        nonce:
          description: Connection nonce.
          format: uint64
          minimum: 0
          type: integer
        peer_id:
          $ref: '#/components/schemas/PublicKey'
        received_bytes_per_sec:
          format: uint64
          minimum: 0
          type: integer
        sent_bytes_per_sec:
          format: uint64
          minimum: 0
          type: integer
        tracked_shards:
          items:
            $ref: '#/components/schemas/ShardId'
          type: array
      required:
        - addr
        - is_highest_block_invalid
        - tracked_shards
        - archival
        - peer_id
        - received_bytes_per_sec
        - sent_bytes_per_sec
        - last_time_peer_requested_millis
        - last_time_received_message_millis
        - connection_established_time_millis
        - is_outbound_peer
        - nonce
      type: object
    KnownProducerView:
      description: >-
        Information about a Producer: its account name, peer_id and a list of
        connected peers that

        the node can use to send message for this producer.
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        next_hops:
          items:
            $ref: '#/components/schemas/PublicKey'
          nullable: true
          type: array
        peer_id:
          $ref: '#/components/schemas/PublicKey'
      required:
        - account_id
        - peer_id
      type: object
    AccountDataView:
      description: >-
        AccountData is a piece of global state that a validator

        signs and broadcasts to the network.


        It is essentially the data that a validator wants to share with the
        network.

        All the nodes in the network are collecting the account data

        broadcasted by the validators.

        Since the number of the validators is bounded and their

        identity is known (and the maximal size of allowed AccountData is
        bounded)

        the global state that is distributed in the form of AccountData is
        bounded

        as well.

        Find more information in the docs
        [here](https://github.com/near/nearcore/blob/560f7fc8f4b3106e0d5d46050688610b1f104ac6/chain/client/src/client.rs#L2232)
      properties:
        account_key:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: Account key of the validator signing this AccountData.
        peer_id:
          allOf:
            - $ref: '#/components/schemas/PublicKey'
          description: ID of the node that handles the account key (aka validator key).
        proxies:
          description: |-
            Proxy nodes that are directly connected to the validator node
            (this list may include the validator node itself).
            TIER1 nodes should connect to one of the proxies to sent TIER1
            messages to the validator.
          items:
            $ref: '#/components/schemas/Tier1ProxyView'
          type: array
        timestamp:
          description: UTC timestamp of when the AccountData has been signed.
          type: string
      required:
        - peer_id
        - proxies
        - account_key
        - timestamp
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
    Tier1ProxyView:
      properties:
        addr:
          type: string
        peer_id:
          $ref: '#/components/schemas/PublicKey'
      required:
        - addr
        - peer_id
      type: object

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.