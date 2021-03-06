module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var calendar_to_create = data.calendar;
    context.log(calendar_to_create);

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';
    private_key = private_key.split('\\n').join("\n");

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
        resource: calendar_to_create
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.res = {
                status: 500,
                body: err
            };
            context.done(err);
            return;
        }
        calendar.calendars.insert(params, function (err, result) {
            if (err) {
                context.res = {
                    status: 500,
                    body: err
                };
                context.done(err);
                return;
            }
            var created_calendar = result;
            message = 'Created calendar '+ calendar_id;
            var event_type = "ca.wrdsb.igor.google_calendar.create";
            var flynn_event = {
                eventID: `${event_type}-${context.executionContext.invocationId}`,
                eventType: event_type,
                source: `/google/calendar/create`,
                schemaURL: "https://mcp.wrdsb.io/schemas/igor/calendar_create-event.json",
                extensions: { 
                    label: "IGOR creates Google Calendar", 
                    tags: [
                        "igor", 
                        "google_calendar", 
                        "create"
                    ] 
                },
                data: {
                    function_name: context.executionContext.functionName,
                    invocation_id: context.executionContext.invocationId,
                    payload: created_calendar,
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
        });
    });
};
