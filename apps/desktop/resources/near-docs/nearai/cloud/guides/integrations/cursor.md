> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Cursor

> Configure Cursor with NEAR AI Cloud through Cursor's OpenAI API key and base URL settings.

> [!WARNING]
>
> **Limited support**
>
> Cursor can accept an OpenAI API key and an overridden OpenAI-compatible base URL, but public Cursor reports show limits around custom endpoint routing. Treat this as a chat or plan-style setup, and verify in your Cursor install before relying on it for daily work.

These steps use public Cursor API key and base URL behavior checked on 2026-06-23. Composer, Agent, autocomplete, and inline edit routing are not documented as verified for NEAR AI Cloud, so do not assume those features use NEAR just because the OpenAI base URL is overridden.

## Overview

Use this guide when you want to try NEAR AI Cloud from Cursor's OpenAI-compatible settings. The intended settings are:

| Setting | Value |
| - | - |
| Base URL | `https://cloud-api.near.ai/v1` |
| Model ID | `z-ai/glm-5.2` |
| API key | A NEAR AI Cloud API key |

Keep the OpenAI API key toggle enabled while testing NEAR AI Cloud. If you turn it off, Cursor may stop sending requests with your custom key.

## Prerequisites

* Cursor installed.
* A NEAR AI Cloud API key from the [NEAR AI Cloud Dashboard](https://cloud.near.ai/dashboard/organizations).
* A text-only prompt you can use to test Chat or Plan mode.

Do not paste a real API key into shared screenshots, issue reports, or checked-in files.

## Base URL

Use the gateway base URL:

```text theme={"dark"}
https://cloud-api.near.ai/v1
```

Do not use the full chat completions endpoint as the Cursor base URL. Cursor adds paths such as `/chat/completions` itself, so a base URL ending in `/chat/completions` can become a doubled path.

## Model ID

Use the exact model ID from NEAR AI Cloud:

```text theme={"dark"}
z-ai/glm-5.2
```

Do not invent neutral aliases unless NEAR accepts them. For example, do not rename the model to `glm-5.2`, `nearai-glm`, or another convenience alias unless that exact ID appears in the NEAR model list or in the specific endpoint you are using.

For the current model list, see [Model Discovery and Refresh](https://docs.near.ai/cloud/guides/integrations/model-discovery.md).

## Configure

In Cursor, follow this path:

```text theme={"dark"}
Settings -> Models -> Add OpenAI API Key -> Override OpenAI Base URL -> https://cloud-api.near.ai/v1 -> add model z-ai/glm-5.2
```

Recommended setup:

1. Open **Settings**.
2. Go to **Models**.
3. Choose **Add OpenAI API Key**.
4. Paste your NEAR AI Cloud API key into Cursor's OpenAI API key field.
5. Keep the OpenAI API key toggle enabled.
6. Enable **Override OpenAI Base URL**.
7. Enter `https://cloud-api.near.ai/v1`.
8. Add a custom model with the exact ID `z-ai/glm-5.2`.
9. Select `z-ai/glm-5.2` in the Chat or Plan model picker and send a small text-only prompt.

Important caveats:

* The custom base URL may affect Cursor-provided models while the override is enabled.
* Only chat/plan-style calls may work through the override.
* Composer, Agent, autocomplete, and inline edit routing is not documented as verified for NEAR AI Cloud.
* If you need Cursor-provided models again, you may need to disable the OpenAI API key toggle or the base URL override, then reselect the Cursor model.

## Refresh models

Cursor may not automatically discover every model from `GET /v1/models`. When NEAR AI Cloud releases a new model:

1. Check the live model list:

   ```bash theme={"dark"}
   curl -fsSL https://cloud-api.near.ai/v1/models \
     | jq '.data[] | select(.id == "z-ai/glm-5.2")'
   ```

2. Copy the exact `id` value.

3. Add or update that model ID in Cursor's Models settings.

4. Re-select the model in the Chat or Plan model picker.

5. Restart Cursor if the picker keeps showing an old model list.

## Quick test

First verify NEAR AI Cloud directly, before debugging Cursor:

```bash theme={"dark"}
curl https://cloud-api.near.ai/v1/chat/completions \
  -H "Authorization: Bearer $NEARAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "z-ai/glm-5.2",
    "messages": [
      {"role": "user", "content": "Reply with only: near-ai-ok"}
    ],
    "max_tokens": 20
  }'
```

If curl works, test Cursor with a plain text Chat or Plan prompt. If Cursor fails while curl succeeds, treat it as a Cursor custom-endpoint issue and verify the current behavior in your Cursor install.

## Troubleshooting

| Symptom | Likely cause | Fix |
| - | - | - |
| `z-ai/glm-5.2` or another model not listed | Cursor has a stale model picker or does not auto-fetch NEAR's model list. | Confirm the model with `curl https://cloud-api.near.ai/v1/models`, then add the exact model ID manually in Cursor's Models settings. Restart Cursor if the picker does not update. |
| `401` | Cursor is not sending a valid NEAR AI Cloud API key, the OpenAI API key toggle is off, or the key is invalid. | Re-enter the NEAR AI Cloud API key, keep the OpenAI API key toggle enabled, and retry the curl smoke test without logging the key. |
| Wrong base URL `/chat/completions` | The full request endpoint was pasted into Cursor's base URL field. | Use `https://cloud-api.near.ai/v1` as the base URL. Do not append `/chat/completions`; Cursor adds request paths itself. |
| Cursor-provided models fail after enabling the override | Cursor's custom OpenAI base URL can affect models beyond the one you added. | Disable the OpenAI API key toggle or base URL override when switching back to Cursor-provided models, then reselect the Cursor model. |
| Composer, Agent, autocomplete, or inline edit does not use NEAR AI Cloud | Those routes are not documented as verified for NEAR AI Cloud through Cursor's custom OpenAI endpoint. | Use Cursor Chat or Plan for this limited setup, or use another NEAR AI Cloud integration for full coding-agent routing. |

## Related guides

* [Model Discovery and Refresh](https://docs.near.ai/cloud/guides/integrations/model-discovery.md)
* [OpenAI Compatibility](https://docs.near.ai/cloud/guides/openai-compatibility.md)
* [Available Models](https://docs.near.ai/cloud/models.md)
* [Continue](https://docs.near.ai/cloud/guides/integrations/continue.md)
* [Cline, Roo Code, and Kilo Code](https://docs.near.ai/cloud/guides/integrations/cline-roo-kilo.md)

## Sources Checked

Sources checked on 2026-06-23:

* [Cursor API keys](https://cursor.com/help/models-and-usage/api-keys)
* [LLM Gateway Cursor guide](https://docs.llmgateway.io/guides/cursor)
* Public Cursor forum reports about custom OpenAI base URL and Composer/custom key behavior


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.