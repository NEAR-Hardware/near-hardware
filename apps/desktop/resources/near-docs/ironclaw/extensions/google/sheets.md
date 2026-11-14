> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Sheets

> Let your agent read and write Google Spreadsheets

The Google Sheets extension allows your agent to interact with Google Sheets — creating spreadsheets, reading and writing cell ranges, appending rows, formatting cells, and managing sheets. It uses standard A1 notation for ranges and is ideal for data entry automation, report generation, and spreadsheet-driven workflows.

***

## Setup

If you haven't set up Google OAuth yet, complete the [Google OAuth Setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first.

**1. Enable the Google Sheets API**

In your Google Cloud project, navigate to **APIs & Services → Library**, search for **Google Sheets API**, and click **Enable**.

**2. Install the Extension**

```bash theme={null}
ironclaw extension install google-sheets
```

**3. Authorize Access**

```bash theme={null}
ironclaw extension activate google-sheets
```

Activating an extension that needs credentials starts its setup flow. Complete it from **Extensions** in the [web interface](https://docs.ironclaw.com/using/webui.md) — for Google services that means the OAuth consent screen. Follow the [auth setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first so your agent can capture the callback. Tokens are stored encrypted and refreshed automatically.

> [!TIP]
>
> If you already authenticated one Google service, you still need to authenticate each additional Google extension separately.

***

## Available Actions

* `create_spreadsheet`: Create a new spreadsheet with an optional title and initial sheet names
* `get_spreadsheet`: Retrieve spreadsheet metadata (title, sheet names, named ranges)
* `read_values`: Read cell values from a range using A1 notation (e.g. `Sheet1!A1:D10`)
* `batch_read_values`: Read multiple ranges in a single API call
* `write_values`: Write values to a range, replacing existing content
* `append_values`: Append rows after the last row that contains data in a range
* `clear_values`: Clear all values from a range (preserving formatting)
* `add_sheet`: Add a new sheet (tab) to an existing spreadsheet
* `delete_sheet`: Delete a sheet by its ID
* `rename_sheet`: Rename an existing sheet
* `format_cells`: Apply number formats, text styles, or background colors to a cell range

***

## Example Usage

Once configured, you can ask your agent things like:

* *"Create a new spreadsheet called 'Monthly Expenses'"*
* *"Read the values from cells A1 to E20 in my budget sheet"*
* *"Add a new row with today's sales data to the 'Sales' tab"*
* *"Clear all data from the 'Draft' sheet"*
* *"Rename the first sheet to 'Summary'"*
* *"Format column B as currency in my expenses spreadsheet"*

***

## Using A1 Notation

All range operations use standard A1 notation. You can include the sheet name to target a specific tab:

| Notation | Meaning |
| - | - |
| `A1` | Single cell |
| `A1:C10` | Range across rows and columns |
| `Sheet1!A1:B5` | Range on a specific sheet |
| `Sheet1!A:A` | Entire column A on Sheet1 |

> [!TIP]
>
> If your spreadsheet has multiple sheets, include the sheet name in the range (e.g. `Budget!B2:D50`) so the agent targets the right tab.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.