> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Post experimental call function

> Calls a view function on a contract and returns the result.



## OpenAPI

````yaml /openapi.json post /EXPERIMENTAL_call_function
openapi: 3.0.0
info:
  title: NEAR Protocol JSON RPC API
  version: 1.3.39
servers: []
security: []
paths:
  /EXPERIMENTAL_call_function:
    post:
      description: Calls a view function on a contract and returns the result.
      operationId: EXPERIMENTAL_call_function
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/JsonRpcRequest_for_EXPERIMENTAL_call_function
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/JsonRpcResponse_for_RpcCallFunctionResponse_and_RpcCallFunctionError
components:
  schemas:
    JsonRpcRequest_for_EXPERIMENTAL_call_function:
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
            - EXPERIMENTAL_call_function
          type: string
        params:
          $ref: '#/components/schemas/RpcCallFunctionRequest'
      required:
        - params
        - method
      title: JsonRpcRequest_for_EXPERIMENTAL_call_function
      type: object
    JsonRpcResponse_for_RpcCallFunctionResponse_and_RpcCallFunctionError:
      oneOf:
        - properties:
            result:
              $ref: '#/components/schemas/RpcCallFunctionResponse'
          required:
            - result
          type: object
        - properties:
            error:
              $ref: '#/components/schemas/ErrorWrapper_for_RpcCallFunctionError'
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
      title: JsonRpcResponse_for_RpcCallFunctionResponse_and_RpcCallFunctionError
      type: object
    RpcCallFunctionRequest:
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
      properties:
        account_id:
          $ref: '#/components/schemas/AccountId'
        args_base64:
          $ref: '#/components/schemas/FunctionArgs'
        method_name:
          type: string
      required:
        - account_id
        - method_name
        - args_base64
      title: RpcCallFunctionRequest
      type: object
    RpcCallFunctionResponse:
      description: A result returned by contract method
      properties:
        block_hash:
          $ref: '#/components/schemas/CryptoHash'
        block_height:
          format: uint64
          minimum: 0
          type: integer
        logs:
          items:
            type: string
          type: array
        result:
          items:
            format: uint8
            maximum: 255
            minimum: 0
            type: integer
          type: array
      required:
        - result
        - logs
        - block_height
        - block_hash
      type: object
    ErrorWrapper_for_RpcCallFunctionError:
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
              $ref: '#/components/schemas/RpcCallFunctionError'
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
    CryptoHash:
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
    RpcCallFunctionError:
      oneOf:
        - properties:
            info:
              properties:
                block_reference:
                  $ref: '#/components/schemas/BlockReference'
              required:
                - block_reference
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
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - INVALID_ACCOUNT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - UNKNOWN_ACCOUNT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                requested_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - requested_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - UNINITIALIZED_ACCOUNT
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                contract_account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - contract_account_id
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - NO_CONTRACT_CODE
              type: string
          required:
            - name
            - info
          type: object
        - properties:
            info:
              properties:
                block_hash:
                  $ref: '#/components/schemas/CryptoHash'
                block_height:
                  format: uint64
                  minimum: 0
                  type: integer
                vm_error:
                  $ref: '#/components/schemas/FunctionCallError'
              required:
                - vm_error
                - block_height
                - block_hash
              type: object
            name:
              enum:
                - CONTRACT_EXECUTION_ERROR
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
    BlockReference:
      oneOf:
        - additionalProperties: false
          properties:
            block_id:
              $ref: '#/components/schemas/BlockId'
          required:
            - block_id
          type: object
        - additionalProperties: false
          properties:
            finality:
              $ref: '#/components/schemas/Finality'
          required:
            - finality
          type: object
        - additionalProperties: false
          properties:
            sync_checkpoint:
              $ref: '#/components/schemas/SyncCheckpoint'
          required:
            - sync_checkpoint
          type: object
    FunctionCallError:
      description: >-
        Serializable version of `near-vm-runner::FunctionCallError`.


        Must never reorder/remove elements, can only add new variants at the end
        (but do that very

        carefully). It describes stable serialization format, and only used by
        serialization logic.
      oneOf:
        - enum:
            - WasmUnknownError
            - _EVMError
          type: string
        - additionalProperties: false
          description: Wasm compilation error
          properties:
            CompilationError:
              $ref: '#/components/schemas/CompilationError'
          required:
            - CompilationError
          type: object
        - additionalProperties: false
          description: >-
            Wasm binary env link error


            Note: this is only to deserialize old data, use execution error for
            new data
          properties:
            LinkError:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - LinkError
          type: object
        - additionalProperties: false
          description: Import/export resolve error
          properties:
            MethodResolveError:
              $ref: '#/components/schemas/MethodResolveError'
          required:
            - MethodResolveError
          type: object
        - additionalProperties: false
          description: >-
            A trap happened during execution of a binary


            Note: this is only to deserialize old data, use execution error for
            new data
          properties:
            WasmTrap:
              $ref: '#/components/schemas/WasmTrap'
          required:
            - WasmTrap
          type: object
        - additionalProperties: false
          description: >-
            Note: this is only to deserialize old data, use execution error for
            new data
          properties:
            HostError:
              $ref: '#/components/schemas/HostError'
          required:
            - HostError
          type: object
        - additionalProperties: false
          properties:
            ExecutionError:
              type: string
          required:
            - ExecutionError
          type: object
    CompilationError:
      oneOf:
        - additionalProperties: false
          properties:
            CodeDoesNotExist:
              properties:
                account_id:
                  $ref: '#/components/schemas/AccountId'
              required:
                - account_id
              type: object
          required:
            - CodeDoesNotExist
          type: object
        - additionalProperties: false
          properties:
            PrepareError:
              $ref: '#/components/schemas/PrepareError'
          required:
            - PrepareError
          type: object
        - additionalProperties: false
          description: >-
            This is for defense in depth.

            We expect our runtime-independent preparation code to fully catch
            all invalid wasms,

            but, if it ever misses something we’ll emit this error
          properties:
            WasmerCompileError:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - WasmerCompileError
          type: object
    MethodResolveError:
      enum:
        - MethodEmptyName
        - MethodNotFound
        - MethodInvalidSignature
      type: string
    WasmTrap:
      description: A kind of a trap happened during execution of a binary
      oneOf:
        - description: An `unreachable` opcode was executed.
          enum:
            - Unreachable
          type: string
        - description: Call indirect incorrect signature trap.
          enum:
            - IncorrectCallIndirectSignature
          type: string
        - description: Memory out of bounds trap.
          enum:
            - MemoryOutOfBounds
          type: string
        - description: Call indirect out of bounds trap.
          enum:
            - CallIndirectOOB
          type: string
        - description: An arithmetic exception, e.g. divided by zero.
          enum:
            - IllegalArithmetic
          type: string
        - description: Misaligned atomic access trap.
          enum:
            - MisalignedAtomicAccess
          type: string
        - description: Indirect call to null.
          enum:
            - IndirectCallToNull
          type: string
        - description: Stack overflow.
          enum:
            - StackOverflow
          type: string
        - description: Generic trap.
          enum:
            - GenericTrap
          type: string
    HostError:
      oneOf:
        - description: String encoding is bad UTF-16 sequence
          enum:
            - BadUTF16
          type: string
        - description: String encoding is bad UTF-8 sequence
          enum:
            - BadUTF8
          type: string
        - description: Exceeded the prepaid gas
          enum:
            - GasExceeded
          type: string
        - description: Exceeded the maximum amount of gas allowed to burn per contract
          enum:
            - GasLimitExceeded
          type: string
        - description: Exceeded the account balance
          enum:
            - BalanceExceeded
          type: string
        - description: Tried to call an empty method name
          enum:
            - EmptyMethodName
          type: string
        - additionalProperties: false
          description: Smart contract panicked
          properties:
            GuestPanic:
              properties:
                panic_msg:
                  type: string
              required:
                - panic_msg
              type: object
          required:
            - GuestPanic
          type: object
        - description: IntegerOverflow happened during a contract execution
          enum:
            - IntegerOverflow
          type: string
        - additionalProperties: false
          description: '`promise_idx` does not correspond to existing promises'
          properties:
            InvalidPromiseIndex:
              properties:
                promise_idx:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - promise_idx
              type: object
          required:
            - InvalidPromiseIndex
          type: object
        - description: Actions can only be appended to non-joint promise.
          enum:
            - CannotAppendActionToJointPromise
          type: string
        - description: Returning joint promise is currently prohibited
          enum:
            - CannotReturnJointPromise
          type: string
        - additionalProperties: false
          description: Accessed invalid promise result index
          properties:
            InvalidPromiseResultIndex:
              properties:
                result_idx:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - result_idx
              type: object
          required:
            - InvalidPromiseResultIndex
          type: object
        - additionalProperties: false
          description: Accessed invalid register id
          properties:
            InvalidRegisterId:
              properties:
                register_id:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - register_id
              type: object
          required:
            - InvalidRegisterId
          type: object
        - additionalProperties: false
          description: >-
            Iterator `iterator_index` was invalidated after its creation by
            performing a mutable operation on trie
          properties:
            IteratorWasInvalidated:
              properties:
                iterator_index:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - iterator_index
              type: object
          required:
            - IteratorWasInvalidated
          type: object
        - description: Accessed memory outside the bounds
          enum:
            - MemoryAccessViolation
          type: string
        - additionalProperties: false
          description: VM Logic returned an invalid receipt index
          properties:
            InvalidReceiptIndex:
              properties:
                receipt_index:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - receipt_index
              type: object
          required:
            - InvalidReceiptIndex
          type: object
        - additionalProperties: false
          description: Iterator index `iterator_index` does not exist
          properties:
            InvalidIteratorIndex:
              properties:
                iterator_index:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - iterator_index
              type: object
          required:
            - InvalidIteratorIndex
          type: object
        - description: VM Logic returned an invalid account id
          enum:
            - InvalidAccountId
          type: string
        - description: VM Logic returned an invalid method name
          enum:
            - InvalidMethodName
          type: string
        - description: VM Logic provided an invalid public key
          enum:
            - InvalidPublicKey
          type: string
        - additionalProperties: false
          description: '`method_name` is not allowed in view calls'
          properties:
            ProhibitedInView:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - ProhibitedInView
          type: object
        - additionalProperties: false
          description: The total number of logs will exceed the limit.
          properties:
            NumberOfLogsExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - limit
              type: object
          required:
            - NumberOfLogsExceeded
          type: object
        - additionalProperties: false
          description: The storage key length exceeded the limit.
          properties:
            KeyLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - KeyLengthExceeded
          type: object
        - additionalProperties: false
          description: The storage value length exceeded the limit.
          properties:
            ValueLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - ValueLengthExceeded
          type: object
        - additionalProperties: false
          description: The total log length exceeded the limit.
          properties:
            TotalLogLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - TotalLogLengthExceeded
          type: object
        - additionalProperties: false
          description: >-
            The maximum number of promises within a FunctionCall exceeded the
            limit.
          properties:
            NumberPromisesExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_promises:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_promises
                - limit
              type: object
          required:
            - NumberPromisesExceeded
          type: object
        - additionalProperties: false
          description: The maximum number of input data dependencies exceeded the limit.
          properties:
            NumberInputDataDependenciesExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                number_of_input_data_dependencies:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - number_of_input_data_dependencies
                - limit
              type: object
          required:
            - NumberInputDataDependenciesExceeded
          type: object
        - additionalProperties: false
          description: The returned value length exceeded the limit.
          properties:
            ReturnedValueLengthExceeded:
              properties:
                length:
                  format: uint64
                  minimum: 0
                  type: integer
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - length
                - limit
              type: object
          required:
            - ReturnedValueLengthExceeded
          type: object
        - additionalProperties: false
          description: The contract size for DeployContract action exceeded the limit.
          properties:
            ContractSizeExceeded:
              properties:
                limit:
                  format: uint64
                  minimum: 0
                  type: integer
                size:
                  format: uint64
                  minimum: 0
                  type: integer
              required:
                - size
                - limit
              type: object
          required:
            - ContractSizeExceeded
          type: object
        - additionalProperties: false
          description: The host function was deprecated.
          properties:
            Deprecated:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - Deprecated
          type: object
        - additionalProperties: false
          description: General errors for ECDSA recover.
          properties:
            ECRecoverError:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - ECRecoverError
          type: object
        - additionalProperties: false
          description: >-
            Invalid input to alt_bn128 family of functions (e.g., point which
            isn't

            on the curve).
          properties:
            AltBn128InvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - AltBn128InvalidInput
          type: object
        - additionalProperties: false
          description: >-
            Invalid input to ed25519 signature verification function (e.g.
            signature cannot be

            derived from bytes).
          properties:
            Ed25519VerifyInvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - Ed25519VerifyInvalidInput
          type: object
        - additionalProperties: false
          description: >-
            Input length mismatch for p256 signature verification (signature is
            not 64

            bytes or public key is not 33 bytes). Parse failures of otherwise

            well-sized inputs return 0 from the host function instead of
            aborting.
          properties:
            P256VerifyInvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - P256VerifyInvalidInput
          type: object
        - additionalProperties: false
          description: >-
            Input length mismatch for ML-DSA-65 signature verification
            (signature is

            not 3309 bytes or public key is not 1952 bytes). Parse failures of

            otherwise well-sized inputs return 0 from the host function instead
            of

            aborting.
          properties:
            MlDsaVerifyInvalidInput:
              properties:
                msg:
                  type: string
              required:
                - msg
              type: object
          required:
            - MlDsaVerifyInvalidInput
          type: object
        - additionalProperties: false
          description: '`method_name` is not allowed in external contract calls'
          properties:
            ProhibitedInExternalCall:
              properties:
                method_name:
                  type: string
              required:
                - method_name
              type: object
          required:
            - ProhibitedInExternalCall
          type: object
        - description: >-
            An external contract call has an attached deposit, which it cannot
            have
          enum:
            - DepositInExternalCall
          type: string
    PrepareError:
      description: Error that can occur while preparing or executing Wasm smart-contract.
      oneOf:
        - description: Error happened while serializing the module.
          enum:
            - Serialization
          type: string
        - description: Error happened while deserializing the module.
          enum:
            - Deserialization
          type: string
        - description: Internal memory declaration has been found in the module.
          enum:
            - InternalMemoryDeclared
          type: string
        - description: |-
            Gas instrumentation failed.

            This most likely indicates the module isn't valid.
          enum:
            - GasInstrumentation
          type: string
        - description: |-
            Stack instrumentation failed.

            This  most likely indicates the module isn't valid.
          enum:
            - StackHeightInstrumentation
          type: string
        - description: |-
            Error happened during instantiation.

            This might indicate that `start` function trapped, or module isn't
            instantiable and/or un-linkable.
          enum:
            - Instantiate
          type: string
        - description: Error creating memory.
          enum:
            - Memory
          type: string
        - description: Contract contains too many functions.
          enum:
            - TooManyFunctions
          type: string
        - description: Contract contains too many locals.
          enum:
            - TooManyLocals
          type: string
        - description: Contract contains too many tables.
          enum:
            - TooManyTables
          type: string
        - description: Contract contains too many table elements.
          enum:
            - TooManyTableElements
          type: string
        - description: A function body in the contract exceeds the size limit.
          enum:
            - FunctionBodyTooLarge
          type: string
        - description: The instrumented code exceeds the size limit.
          enum:
            - InstrumentedCodeTooLarge
          type: string
        - description: A function contains too many basic blocks.
          enum:
            - TooManyBlocksPerFunction
          type: string
        - description: A contract contains too many basic blocks.
          enum:
            - TooManyBlocksPerContract
          type: string
        - description: Contract declares too many entries in the wasm type section.
          enum:
            - TooManyTypes
          type: string
        - description: >-
            All contract functions combined have more than
            `max_params_per_contract` parameters.
          enum:
            - TooManyParamsPerFunction
          type: string
        - description: A function has more than `max_params_per_function` parameters.
          enum:
            - TooManyParamsPerContract
          type: string
        - description: |-
            A function's max operand-stack size (in bytes) exceeds
            `max_operand_stack_bytes_per_function`.
          enum:
            - OperandStackTooLarge
          type: string
        - description: Contract declares too many entries in the wasm global section.
          enum:
            - TooManyGlobals
          type: string

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.