module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var calendar_to_list = data.calendar;

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log('List memberships for calendar ' + calendar_to_list);

    var google = require('googleapis');
    var calendar = google.calendar('v3');

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
        ['https://www.googleapis.com/auth/calendar'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        calendarId: calendar_to_list,
        maxResults: 250
    };

    var members = {};

    var memberships_array = [];
    var memberships_object = {};
    memberships_object.id = calendar_to_list;
    memberships_object.actual = {};

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.done(err);
            return;
        }
        getMembers(params, function() {
            var message = '';
            if (memberships_array.length > 0) {
                message = 'Final results: Got ' + memberships_array.length + ' members for ' + calendar_to_list;
            }
            var event_type = "ca.wrdsb.igor.google_calendar_membership.list";
            var flynn_event = {
                eventID: `${event_type}-${context.executionContext.invocationId}`,
                eventType: event_type,
                source: `/google/calendar/${calendar_id}/memberships`,
                schemaURL: "https://mcp.wrdsb.io/schemas/igor/calendar_acl_list-event.json",
                extensions: { 
                    label: "IGOR lists Google Calendar Memberships", 
                    tags: [
                        "igor", 
                        "google_calendar",
                        "google_calendar_membership", 
                        "google_calendar_memberships", 
                        "list"
                    ] 
                },
                data: {
                    function_name: context.executionContext.functionName,
                    invocation_id: context.executionContext.invocationId,
                    payload: {
                        blobs: [
                            {
                                name: "all-memberships-array",
                                storage_account: "wrdsb-igor_STORAGE",
                                path: `calendar-memberships/${calendar_id}-array.json`
                            },
                            {
                                name: "all-memberships-object",
                                storage_account: "wrdsb-igor_STORAGE",
                                path: `calendar-memberships/${calendar_id}-object.json`
                            }
                        ]
                    },
                    message: message
                },
                eventTime: execution_timestamp,
                eventTypeVersion: "0.1",
                cloudEventsVersion: "0.1",
                contentType: "application/json"
            };
            events.push(JSON.stringify(flynn_event));

            context.bindings.membershipsArrayBlob = memberships_array;
            context.bindings.membershipsObjectBlob = memberships_object;

            var res_body = flynn_event.data;
            res_body.payload.memberships = memberships_object;

            context.res = {
                status: 200,
                body: res_body
            };

            context.log(message);
            context.done(null, message);
        });
    });

    function getMembers(params, callback) {
        calendar.acl.list(params, function (err, result) {
            if (err) {
                context.log(result);
                context.done(err);
            }
            if (result.items) {
                context.log('Got ' + result.items.length + ' more members for ' + calendar_to_list);
                result.items.forEach(function(member) {
                    memberships_object.actual[member.scope.value] = member;
                    memberships_array.push(member);
                });
            } else { 
                context.log('Got 0 members for ' + calendar_to_list);
            }
            if (result.nextPageToken) {
                params.pageToken = result.nextPageToken;
                getMembers(params, callback);
            } else {
                callback();
            }
        });
    }
};
