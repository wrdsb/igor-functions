# Calendar ACL List
List all calendar ACL entries for a given calendar.

## Request
POST Reqest with JSON body:

```json
{"calendar": "calendarId@group.calendar.google.com"}
```

## Response
A JSON object, with properties 'id' (the calendar id), and 'actual' (an array of ACL rules):

```json
{
  "id": "calendarId@group.calendar.google.com",
  "actual": [
    {
      "kind": "calendar#aclRule",
      "etag": "\"00000000000000000000\"",
      "id": "user:email_address@wrdsb.ca",
      "scope": {
        "type": "user",
        "value": "email_address@wrdsb.ca"
      },
      "role": "owner"
    },
    {
      "kind": "calendar#aclRule",
      "etag": "\"00001505854084498000\"",
      "id": "user:email_address@wrdsb.ca",
      "scope": {
        "type": "user",
        "value": "email_address@wrdsb.ca"
      },
      "role": "writer"
    },
    {
      "kind": "calendar#aclRule",
      "etag": "\"00001516272292151000\"",
      "id": "user:email_address@wrdsb.ca",
      "scope": {
        "type": "user",
        "value": "email_address@wrdsb.ca"
      },
      "role": "reader"
    },
    {
      "kind": "calendar#aclRule",
      "etag": "\"00001505854122820000\"",
      "id": "user:email_address@wrdsb.ca",
      "scope": {
        "type": "user",
        "value": "email_address@wrdsb.ca"
      },
      "role": "reader"
    }
  ]
}
```