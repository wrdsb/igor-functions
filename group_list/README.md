# Group List
List groups.

## Request
HTTP POST

Body:
{ "return_type": "admin_created_groups_array" }

### Valid return_type values:
* 'all_groups_array'
* 'admin_created_groups_array'
* 'user_created_groups_array'
* 'all_groups_object'
* 'admin_created_groups_object'
* 'user_created_groups_object'
* 'stats'

Defaults to 'stats'.

## Response
