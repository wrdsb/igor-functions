module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var member_to_create = data;

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log('Create membership for ' + member_to_create.email + ' in group ' + member_to_create.groupKey);

    var series = require('async/series');

    var google = require('googleapis');
    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // stores our member in the end
    var member_created = {};

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
        resource: member_to_create,
        groupKey: member_to_create.groupKey
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createMember(createMemberCallback) {
                directory.members.insert(params, function (err, result) {
                    if (err) {
                        if (err.code == 409) {
                            result = 'Member ' + member_to_create.email + ' already exists.';
                            context.log(result);
                            createMemberCallback(null, result);
                            return;
                        }
                        createMemberCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createMemberCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                var message = 'Created membership for ' + member_to_create.email + ' in group ' + member_to_create.groupKey;
                var event_type = "ca.wrdsb.igor.google_group_membership.create";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/group/${member_to_create.groupKey}/membership/create`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/member_create-event.json",
                    extensions: { 
                        label: "IGOR creates Google Group Membership", 
                        tags: [
                            "igor", 
                            "google_group",
                            "google_groups",
                            "google_group_memberships",
                            "google_groups_memberships",
                            "create"
                        ] 
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: results[0],
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
