> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Calendar

> Let your agent manage your Google Calendar

The Google Calendar extension allows your agent to interact with your Google Calendar — creating events, checking your schedule, updating appointments, and more. It's ideal for automating scheduling tasks, setting reminders, or managing meetings directly from your agent.

***

## Setup

If you haven't set up Google OAuth yet, complete the [Google OAuth Setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first.

**1. Enable the Google Calendar API**

In your Google Cloud project, navigate to **APIs & Services → Library**, search for [**Google Calendar API**](https://console.cloud.google.com/marketplace/product/google/calendar-json.googleapis.com?q=search\&referrer=search), and click **Enable**.

**2. Install the Extension**

```bash theme={null}
ironclaw extension install google-calendar
```

**3. Authorize Access**

```bash theme={null}
ironclaw extension activate google-calendar
```

Activating an extension that needs credentials starts its setup flow. Complete it from **Extensions** in the [web interface](https://docs.ironclaw.com/using/webui.md) — for Google services that means the OAuth consent screen. Follow the [auth setup](https://docs.ironclaw.com/extensions/google/oauth-setup.md) first so your agent can capture the callback. Tokens are stored encrypted and refreshed automatically.

> [!TIP]
>
> If you already authenticated one Google service, you still need to authenticate each additional Google extension separately.

***

## Available Actions

* `list_calendars`: List all calendars in your Google account
* `list_events`: List upcoming events in a calendar
* `get_event`: Get details of a specific event
* `create_event`: Create a new calendar event
* `update_event`: Update an existing event (title, time, description, attendees)
* `delete_event`: Delete a calendar event
* `find_free_slots`: Find available time slots across one or more calendars
* `add_attendees`: Add attendees to an existing event
* `set_reminder`: Set a reminder for an event

***

## Example Usage

Once configured, you can ask your agent things like:

* *"Schedule a team sync for next Tuesday at 3pm for 1 hour"*
* *"What's on my calendar this week?"*
* *"Move my Friday meeting to Monday morning"*
* *"Find a free 30-minute slot for me and [john@example.com](mailto:john@example.com) this week"*
* *"Cancel all my meetings on Thursday afternoon"*

***

## Working with Multiple Calendars

If your Google account has multiple calendars (personal, work, shared), you can tell your agent which one to use:

> [!TIP]
>
> Say something like: *"Add this to my Work calendar, not my personal one."* The agent will use `list_calendars` to find the right calendar by name before creating the event.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.