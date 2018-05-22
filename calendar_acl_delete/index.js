module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var series = require('async/series');

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_acl_to_delete = data.rule_id;
    var calendar_id = data.calendar_id;

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'],
        user_address
    );

    var params = {
    	auth: jwtClient,
    	alt: "json",
    	calendarId: calendar_id,
    	ruleId: calendar_acl_to_delete
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function deleteCalendarAcl(deleteCalendarAclCallback) {
                calendar.acl.delete(params, function (err, result) {
                    if (err) {
                        deleteCalendarAclCallback(new Error(err));
                        return;
                    }
                    deleteCalendarAclCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                var message = 'Deleted ' + calendar_acl_to_delete + ' membership on ' + calendar_id;
                var event_type = "ca.wrdsb.igor.google_calendar_membership.delete";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/calendar/${calendar_id}/membership/${calendar_acl_to_delete}/delete`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/calendar_acl_delete-event.json",
                    extensions: { 
                        label: "IGOR deletes Google Calendar Membership", 
                        tags: [
                            "igor", 
                            "google_calendar",
                            "google_calendar_membership", 
                            "delete"
                        ] 
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: calendar_acl_to_delete,
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