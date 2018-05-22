module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var series = require('async/series');

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igorbot@igor-168712.iam.gserviceaccount.com';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var calendar_acl_to_create = data.acl;
    var calendar_id = data.calendar_id;
    context.log('Create ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id);

    // stores our calendar in the end
    var calendar_acl_created = {};

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        resource: calendar_acl_to_create,
        calendarId: calendar_id
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createCalendarAcl(createCalendarAclCallback) {
                calendar.acl.insert(params, function (err, result) {
                    if (err) {
                        context.log('Unable to create ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id);
                        createCalendarAclCallback(new Error(err));
                        return;
                    }
                    // context.log(result); - TODO - log this instead
                    createCalendarAclCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                calendar_acl_created = results[0];
                var message = 'Created ' + calendar_acl_to_create.role + ' membership for ' + calendar_acl_to_create.scope.value + ' on calendar ' + calendar_id;
                var event_type = "ca.wrdsb.igor.google_calendar_membership.create";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/calendar/${calendar_id}/membership/create`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/calendar_acl_create-event.json",
                    extensions: { 
                        label: "IGOR creates Google Calendar Membership",
                        tags: [
                            "igor", 
                            "google_calendar",
                            "google_calendar_membership", 
                            "create"
                        ] 
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: calendar_acl_created,
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
                    body: event.data
                };

                context.log(message);
                context.done(null, event.data);
            }
        });
    });
};
