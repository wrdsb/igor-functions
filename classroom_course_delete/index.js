module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var message = '';
    var event_type = "ca.wrdsb.igor.google_classroom_course.delete";
    var flynn_event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: ``,
        schemaURL: "https://mcp.wrdsb.io/schemas/igor/classroom/course_delete-event.json",
        extensions: {
            label: "",
            tags: [
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            payload: {
                course: "",
                blobs: [
                    {
                        name: "",
                        storage_account: "wrdsb-igor_STORAGE",
                        path: ``
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

    context.res = {
        status: 200,
        body: flynn_event.data
    };

    context.log(message);
    context.done(null, message);
};
