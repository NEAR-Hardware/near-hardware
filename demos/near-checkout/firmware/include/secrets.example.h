// Copy to secrets.h (git-ignored) and fill in to run the till standalone over
// Wi-Fi. Leave WIFI_SSID empty to run tethered through tools/companion.mjs.
#pragma once
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
// Optional 1Click partner key (JWT from https://partners.near-intents.org/).
// Without one, 1Click adds its 0.25% no-key fee; keep it out of git.
#define ONECLICK_API_KEY ""
