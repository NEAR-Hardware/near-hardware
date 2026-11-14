> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post network info

> Queries the current state of node network connections. This includes information about active peers, transmitted data, known producers, etc.



## OpenAPI

````yaml /openapi.json post /network_info
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /network_info:
    post:
      description: >-
        Queries the current state of node network connections. This includes
        information about active peers, transmitted data, known producers, etc.
      operationId: network_info
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JsonRpcRequest_for_network_info'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcNetworkInfoResponse_and_RpcNetworkInfoError
components:
  schemas:
    JsonRpcRequest_for_network_info:
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
            - network_info
          type: string
        params:
          $ref: '#/components/schemas/RpcNetworkInfoRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_network_info
      type: object
    JsonRpcResponse_for_RpcNetworkInfoResponse_and_RpcNetworkInfoError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcNetworkInfoResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcNetworkInfoError'
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
      title: JsonRpcResponse_for_RpcNetworkInfoResponse_and_RpcNetworkInfoError
      type: object
    RpcNetworkInfoRequest:
      enum:
        - null
      nullable: true
      title: RpcNetworkInfoRequest
    RpcNetworkInfoResponse:
      properties:
        active_peers:
          items:
            $ref: '#/components/schemas/RpcPeerInfo'
          type: array
        known_producers:
          description: Accounts of known block and chunk producers from routing table.
          items:
            $ref: '#/components/schemas/RpcKnownProducer'
          type: array
        num_active_peers:
          format: uint
          minimum: 0
          type: integer
        peer_max_count:
          format: uint32
          minimum: 0
          type: integer
        received_bytes_per_sec:
          format: uint64
          minimum: 0
          type: integer
        sent_bytes_per_sec:
          format: uint64
          minimum: 0
          type: integer
      required:
        - active_peers
        - num_active_peers
        - peer_max_count
        - sent_bytes_per_sec
        - received_bytes_per_sec
        - known_producers
      type: object
    ErrorWrapper_for_RpcNetworkInfoError:
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
              $ref: '#/components/schemas/RpcNetworkInfoError'
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
    RpcPeerInfo:
      properties:
        account_id:
          anyOf:
            - $ref: '#/components/schemas/AccountId'
            - enum:
                - null
              nullable: true
        addr:
          nullable: true
          type: string
        id:
          $ref: '#/components/schemas/PeerId'
      required:
        - id
      type: object
    RpcKnownProducer:
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        addr:
          nullable: true
          type: string
        peer_id:
          $ref: '#/components/schemas/PeerId'
      required:
        - account_id
        - peer_id
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
    RpcNetworkInfoError:
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
    PeerId:
      allOf:
        - $ref: '#/components/schemas/PublicKey'
      description: Peer id is the public key.
    PublicKey:
      type: string

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.