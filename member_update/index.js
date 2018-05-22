module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var member_to_update = data;

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log('Update membership for '+ member_to_update.email +' in group '+ member_to_update.groupKey +' to role '+ member_to_update.role);

    var google = require('googleapis');
    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/admin.directory.group.member'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        memberKey: member_to_update.email,
        groupKey: member_to_update.groupKey,
        resource: {
            role: member_to_update.role
        }
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        directory.members.update(params, function (err, result) {
            if (err) {
                context.log(result);
                context.done(err);
                return;
            } else {
                var message = 'Updated membership for '+ member_to_update.email +' in group '+ member_to_update.groupKey +' to role '+ member_to_update.role;
                var event_type = "ca.wrdsb.igor.google_group_membership.update";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/group/${member_to_update.groupKey}/membership/update`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/member_update-event.json",
                    extensions: { 
                        label: "IGOR updates Google Group Membership", 
                        tags: [
                            "igor", 
                            "google_group",
                            "google_groups",
                            "google_group_memberships",
                            "google_groups_memberships",
                            "update"
                        ] 
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: member_to_update,
                        message: message
                    },
                    eventTime: execution_timestamp,
                    eventTypeVersion: "0.1",
                    cloudEventsVersion: "0.1",
                    contentType: "application/json"
                };
                events.push(JSON.stringify(flynn_event));

                context.res = {
                    status: 200,
                    body: flynn_event.data
                };

                context.log(message);
                context.done(null, message);
            }
        });
    });
};
