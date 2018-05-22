module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    // TODO: error handling for missing/malformed group email address
    var group = data.group;
    context.log('Delete group: ' + group);

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
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/apps.groups.settings'],
        user_address
    );

    var params = {
        auth: jwtClient,
        groupKey: group,
        alt: "json"
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.res = {
                status: 500,
                body: err
            };
            context.done(err);
            return;
        }
        directory.groups.delete(
            params,
            function(err, result) {
                if (err) {
                    context.res = {
                        status: 500,
                        body: err
                    };
                    context.done(err);
                    return;
                } else {
                    var message = "Deleted group " + group;
                    var event_type = "ca.wrdsb.igor.google_group.delete";
                    var flynn_event = {
                        eventID: `${event_type}-${context.executionContext.invocationId}`,
                        eventType: event_type,
                        source: `/google/group/${group}/delete`,
                        schemaURL: "https://mcp.wrdsb.io/schemas/igor/group_delete-event.json",
                        extensions: { 
                            label: "IGOR deletes Google Group", 
                            tags: [
                                "igor", 
                                "google_group",
                                "google_groups",
                                "delete"
                            ] 
                        },
                        data: {
                            function_name: context.executionContext.functionName,
                            invocation_id: context.executionContext.invocationId,
                            payload: group,
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
            }
        );
    });
};
