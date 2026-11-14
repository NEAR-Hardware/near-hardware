> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Docs

> Let your agent create and edit Google Documents

The Google Docs extension allows your agent to interact with Google Docs — creating documents, inspecting paragraphs and tables, applying anchored edits, creating populated tables, verifying results, and using low-level formatting or batch updates when needed. Semantic operations validate inputs and read provider state back, reducing multi-call index discovery loops.

***

## Setup

If you haven't set up Google OAuth yet, complete the [Google OAuth Setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first.

**1. Enable the Google Docs API**

In your Google Cloud project, navigate to **APIs & Services → Library**, search for **Google Docs API**, and click **Enable**.

**2. Install the Extension**

```bash theme={null}
ironclaw extension install google-docs
```

**3. Authorize Access**

```bash theme={null}
ironclaw extension activate google-docs
```

Activating an extension that needs credentials starts its setup flow. Complete it from **Extensions** in the [web interface](https://docs.ironclaw.com/using/webui.md) — for Google services that means the OAuth consent screen. Follow the [auth setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first so your agent can capture the callback. Tokens are stored encrypted and refreshed automatically.

> [!TIP]
>
> If you already authenticated one Google service, you still need to authenticate each additional Google extension separately.

***

## Available Actions

* `create_document`: Create a new Google Doc with an optional title
* `get_document`: Retrieve document metadata (title, revision, named ranges)
* `read_content`: Extract the plain-text or structured content of a document
* `insert_text`: Insert text at a specific index in the document body
* `delete_content`: Delete a range of content by start and end index
* `replace_text`: Find and replace text throughout the document
* `format_text`: Apply character formatting (bold, italic, font size, color) to a text range
* `format_paragraph`: Apply paragraph styling (heading level, alignment, spacing, indentation) to a range
* `insert_table`: Insert a table with a specified number of rows and columns
* `create_list`: Convert a range of paragraphs into a bulleted or numbered list
* `batch_update`: Send multiple document update requests in a single API call
* `inspect_document`: Inspect paragraphs and tables with stable document indexes
* `apply_text_edits`: Apply validated, tab-scoped text replacements and verify the result
* `create_table_with_data`: Insert, populate, style, and verify a table
* `verify_document`: Check expected text and specific table contents against provider state

***

## Example Usage

Once configured, you can ask your agent things like:

* *"Create a new document titled 'Q2 Marketing Plan'"*
* *"Read the content of document ID 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"*
* *"Insert a summary paragraph at the top of my report"*
* *"Replace all occurrences of 'TBD' with 'Pending Review' in this doc"*
* *"Format the title as Heading 1 and make it bold"*
* *"Add a 3-column table for the budget breakdown"*

***

## Working with Document IDs

Google Doc IDs appear in the document URL:

```
https://docs.google.com/document/d/<DOCUMENT_ID>/edit
```

> [!TIP]
>
> You can tell your agent to "use the document at this URL" and paste the full URL — the agent will extract the document ID automatically.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.