> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental validators ordered

> Returns the current epoch validators ordered in the block producer order with repetition. This endpoint is solely used for bridge currently and is not intended for other external use cases.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_validators_ordered
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_validators_ordered:
    post:
      description: >-
        Returns the current epoch validators ordered in the block producer order
        with repetition. This endpoint is solely used for bridge currently and
        is not intended for other external use cases.
      operationId: EXPERIMENTAL_validators_ordered
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_validators_ordered
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_Array_of_ValidatorStakeView_and_RpcValidatorError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_validators_ordered:
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
            - EXPERIMENTAL_validators_ordered
          type: string
        params:
          $ref: '#/components/schemas/RpcValidatorsOrderedRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_validators_ordered
      type: object
    JsonRpcResponse_for_Array_of_ValidatorStakeView_and_RpcValidatorError:
      oneOf:
        - properties:
            result:
              items:
                $ref: '#/components/schemas/ValidatorStakeView'
              type: array
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
      title: JsonRpcResponse_for_Array_of_ValidatorStakeView_and_RpcValidatorError
      type: object
    RpcValidatorsOrderedRequest:
      properties:
        block_id:
          anyOf:
            - $ref: '#/components/schemas/BlockId'
            - enum:
                - null
              nullable: true
      title: RpcValidatorsOrderedRequest
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
    BlockId:
      anyOf:
        - format: uint64
          minimum: 0
          title: block_height
          type: integer
        - $ref: '#/components/schemas/CryptoHash'
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