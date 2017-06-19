# Manage Calendars

https://developers.google.com/google-apps/calendar/v3/reference/calendars

```javascript
{
  "kind": "calendar#calendar",
  "etag": etag,
  "id": string,
  "summary": string,
  "description": string,
  "location": string,
  "timeZone": string
}
```

```
const google = require('googleapis');
const calendar = google.calendar('v3');
```

https://github.com/google/google-api-nodejs-client/blob/master/apis/calendar/v3.ts
