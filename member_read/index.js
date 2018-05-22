module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var member_to_read = data;
    var membership = {};

    var message = 'Read membership for '+ membership.email +' in group '+ membership.groupKey;
    var event_type = "ca.wrdsb.igor.google_group_membership.read";
    var flynn_event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: `/google/group/${membership.groupKey}/membership/${membership.email}`,
        schemaURL: "https://mcp.wrdsb.io/schemas/igor/member_read-event.json",
        extensions: { 
            label: "IGOR reads Google Group Membership", 
            tags: [
                "igor", 
                "google_group",
                "google_groups",
                "google_group_memberships",
                "google_groups_memberships",
                "read"
            ] 
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            payload: membership,
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
