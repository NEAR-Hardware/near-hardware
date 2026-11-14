> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Drive

> Let your agent manage files and folders in Google Drive

The Google Drive extension allows your agent to interact with your Google Drive — listing, searching, uploading, downloading, sharing, and organizing files and folders. It supports both personal Drive and shared drives, making it ideal for file management workflows, automated uploads, and permission management.

***

## Setup

If you haven't set up Google OAuth yet, complete the [Google OAuth Setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first.

**1. Enable the Google Drive API**

In your Google Cloud project, navigate to **APIs & Services → Library**, search for **Google Drive API**, and click **Enable**.

**2. Install the Extension**

```bash theme={null}
ironclaw extension install google-drive
```

**3. Authorize Access**

```bash theme={null}
ironclaw extension activate google-drive
```

Activating an extension that needs credentials starts its setup flow. Complete it from **Extensions** in the [web interface](https://docs.ironclaw.com/using/webui.md) — for Google services that means the OAuth consent screen. Follow the [auth setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first so your agent can capture the callback. Tokens are stored encrypted and refreshed automatically.

> [!TIP]
>
> If you already authenticated one Google service, you still need to authenticate each additional Google extension separately.

***

## Available Actions

* `list_files`: List files and folders, with optional search query, MIME type filter, and folder scope
* `get_file`: Retrieve metadata for a specific file (name, type, size, owners, permissions)
* `download_file`: Download the content of a file as text or base64
* `upload_file`: Upload a new file with specified content and MIME type
* `update_file`: Update the content or name of an existing file
* `create_folder`: Create a new folder, optionally inside a parent folder
* `delete_file`: Permanently delete a file or folder
* `trash_file`: Move a file to the trash (recoverable)
* `share_file`: Share a file with a user or group with a specified role (reader/writer/owner)
* `list_permissions`: List all permissions on a file
* `remove_permission`: Remove a specific permission from a file
* `list_shared_drives`: List all shared drives accessible to the account

***

## Example Usage

Once configured, you can ask your agent things like:

* *"List all PDF files in my Drive"*
* *"Upload this report as a file named 'Q2-Report.txt'"*
* *"Download the file named 'budget.csv' from my Drive"*
* *"Create a folder called 'Project Assets' inside my 'Work' folder"*
* *"Share the contract with [bob@example.com](mailto:bob@example.com) as a viewer"*
* *"Who has access to my 'Roadmap' document?"*
* *"Move the old proposal to trash"*

***

## Working with Shared Drives

If your Google account has access to shared (team) drives, the agent can target them directly:

> [!TIP]
>
> Say something like: *"List all files in our Engineering shared drive."* The agent will use `list_shared_drives` to find the right drive by name before searching for files within it.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.