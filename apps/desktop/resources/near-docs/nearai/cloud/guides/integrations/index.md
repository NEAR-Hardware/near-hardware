> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrations

> Use NEAR AI Cloud with third-party software that supports OpenAI-compatible providers.

Use these guides to connect third-party software to NEAR AI Cloud through its OpenAI-compatible API.

Most clients need the same values:

| Setting | Value |
| - | - |
| Base URL | `https://cloud-api.near.ai/v1` |
| API key | A NEAR AI Cloud API key |
| Model ID | A model available from NEAR AI Cloud |

## Software Covered

Use the OpenAI client guide when you are configuring code directly. Use the integration guides when a tool has its own provider settings, model picker, or model refresh behavior.

### Coding agents and IDEs

* [OpenCode](https://docs.near.ai/cloud/guides/integrations/opencode.md)
* [Cursor](https://docs.near.ai/cloud/guides/integrations/cursor.md)
* [Continue](https://docs.near.ai/cloud/guides/integrations/continue.md)
* [Cline, Roo Code, and Kilo Code](https://docs.near.ai/cloud/guides/integrations/cline-roo-kilo.md)
* [Aider and Zed](https://docs.near.ai/cloud/guides/integrations/aider-zed.md)
* [Goose](https://docs.near.ai/cloud/guides/opencode-goose.md)

### Self-hosted and team apps

* [LibreChat](https://docs.near.ai/cloud/guides/integrations/librechat.md)
* [Open WebUI](https://docs.near.ai/cloud/guides/integrations/open-webui.md)
* [LiteLLM](https://docs.near.ai/cloud/guides/integrations/litellm.md)
* [Dify](https://docs.near.ai/cloud/guides/integrations/dify.md)

## Model Discovery

NEAR AI Cloud can add new models over time. Use the [Model Discovery guide](https://docs.near.ai/cloud/guides/integrations/model-discovery.md) to check the current Gateway model list and copy the right model ID into clients that do not refresh automatically.

```bash theme={"dark"}
curl https://cloud-api.near.ai/v1/models
```

## Related guides

* [OpenAI Client](https://docs.near.ai/cloud/guides/openai-compatibility.md)
* [Model Discovery](https://docs.near.ai/cloud/guides/integrations/model-discovery.md)
* [Available Models](https://docs.near.ai/cloud/models.md)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.