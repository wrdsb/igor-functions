module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    context.log(data);
    var message = '';
    var event_type = "ca.wrdsb.igor.google_calendar_membership.read";
    var flynn_event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: `/google/calendar/${calendar_id}/membership/${calendar_acl_to_read}`,
        schemaURL: "https://mcp.wrdsb.io/schemas/igor/calendar_acl_read-event.json",
        extensions: { 
            label: "IGOR reads Google Calendar Membership", 
            tags: [
                "igor", 
                "google_calendar",
                "google_calendar_membership", 
                "read"
            ] 
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            payload: calendar_acl,
            message: message
        },
        eventTime: execution_timestamp,
        eventTypeVersion: "0.1",
        cloudEventsVersion: "0.1",
        contentType: "application/json"
    };
    events.push(JSON.stringify(flynn_event));

    context.log(message);
    context.done(null, message);
};
