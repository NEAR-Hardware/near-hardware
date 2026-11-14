> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post next light client block

> Returns the next light client block.



## OpenAPI

````yaml /openapi.json post /next_light_client_block
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /next_light_client_block:
    post:
      description: Returns the next light client block.
      operationId: next_light_client_block
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_next_light_client_block'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcLightClientNextBlockResponse_and_RpcLightClientNextBlockError
components:
  schemas:
    JsonRpcRequest_for_next_light_client_block:
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
            - next_light_client_block
          type: string
        params:
          $ref: '#/components/schemas/RpcLightClientNextBlockRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_next_light_client_block
      type: object
    JsonRpcResponse_for_RpcLightClientNextBlockResponse_and_RpcLightClientNextBlockError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcLightClientNextBlockResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: >-
                #/components/schemas/ErrorWrapper_for_RpcLightClientNextBlockError
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
        JsonRpcResponse_for_RpcLightClientNextBlockResponse_and_RpcLightClientNextBlockError
      type: object
    RpcLightClientNextBlockRequest:
      properties:
        last_block_hash:
          $ref: '#/components/schemas/CryptoHash'
      required:
        - last_block_hash
      title: RpcLightClientNextBlockRequest
      type: object
    RpcLightClientNextBlockResponse:
      description: >-
        A state for the current head of a light client. More info
        [here](https://nomicon.io/ChainSpec/LightClient).
      properties:
        approvals_after_next:
          items:
            anyOf:
              - $ref: '#/components/schemas/Signature'
              - enum:
                  - null
                nullable: true
          type: array
        inner_lite:
          allOf:
            - $ref: '#/components/schemas/BlockHeaderInnerLiteView'
          description: >-
            Inner part of the block header that gets hashed, split into two
            parts, one that is sent
               to light clients, and the rest
        inner_rest_hash:
          $ref: '#/components/schemas/CryptoHash'
        next_block_inner_hash:
          $ref: '#/components/schemas/CryptoHash'
        next_bps:
          items:
            $ref: '#/components/schemas/ValidatorStakeView'
          nullable: true
          type: array
        prev_block_hash:
          $ref: '#/components/schemas/CryptoHash'
      type: object
    ErrorWrapper_for_RpcLightClientNextBlockError:
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
              $ref: '#/components/schemas/RpcLightClientNextBlockError'
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
    CryptoHash:
      type: string
    Signature:
      type: string
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
    RpcLightClientNextBlockError:
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
    EpochId:
      allOf:
        - $ref: '#/components/schemas/CryptoHash'
      description: |-
        Epoch identifier -- wrapped hash, to make it easier to distinguish.
        EpochId of epoch T is the hash of last block in T-2
        EpochId of first two epochs is 0
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
    NearToken:
      type: string

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.