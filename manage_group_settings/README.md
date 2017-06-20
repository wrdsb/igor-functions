# Manage Group Settings
https://developers.google.com/admin-sdk/groups-settings/manage

## Request
```javascript
{
 "kind": "groupsSettings#groups",
 "id": "salesgroup@example.com",
 "email": "salesgroup@example.com",
 "name": "Sales Group",
 "description": "This is the sales group",
 "whoCanViewMembership": "ALL_IN_DOMAIN_CAN_VIEW",
 "whoCanInvite": "ALL_MANAGERS_CAN_INVITE",
 "allowExternalMembers": "false",
 "whoCanPostMessage": "ALL_IN_DOMAIN_CAN_POST",
 "allowWebPosting": "true",
 "primaryLanguage": "en",
 "maxMessageBytes": 10240,
 "isArchived": "true",
 "archiveOnly": "false",
 "messageModerationLevel": "MODERATE_NONE",
 "spamModerationLevel": "ALLOW",
 "replyTo": "REPLY_TO_IGNORE",
 "customReplyTo": "sales@example.com",
 "sendMessageDenyNotification": "true",
 "defaultMessageDenyNotificationText": "Your Message has been denied.",
 "showInGroupDirectory": "false",
 "allowGoogleCommunication": "false",
 "membersCanPostAsTheGroup": "false",
 "messageDisplayFont": "DEFAULT_FONT",
 "includeInGlobalAddressList": "false"
}
```

## Response
```javascript
{
 "kind": "groupsSettings#groups",
 "id": "salesgroup@example.com",
 "email": "salesgroup@example.com",
 "name": "Sales Group",
 "description": "This is the sales group",
 "whoCanViewMembership": "ALL_IN_DOMAIN_CAN_VIEW",
 "whoCanInvite": "ALL_MANAGERS_CAN_INVITE",
 "allowExternalMembers": "false",
 "whoCanPostMessage": "ALL_IN_DOMAIN_CAN_POST",
 "allowWebPosting": "true",
 "primaryLanguage": "en",
 "maxMessageBytes": 10240,
 "isArchived": "true",
 "archiveOnly": "false",
 "messageModerationLevel": "MODERATE_NONE",
 "spamModerationLevel": "ALLOW",
 "replyTo": "REPLY_TO_IGNORE",
 "customReplyTo": "sales@example.com",
 "sendMessageDenyNotification": "true",
 "defaultMessageDenyNotificationText": "Your Message has been denied.",
 "showInGroupDirectory": "false",
 "allowGoogleCommunication": "false",
 "membersCanPostAsTheGroup": "false",
 "messageDisplayFont": "DEFAULT_FONT",
 "includeInGlobalAddressList": "false"
}
```
## Javascript Docs
https://developers.google.com/admin-sdk/groups-settings/quickstart/nodejs

```javascript
var service = google.groupssettings('v1');
```
