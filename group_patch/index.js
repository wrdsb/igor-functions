module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var group = data.group;
    var patch = data.patch;
    context.log('Patch group: ' + group);
    
    var series = require('async/series');

    var google = require('googleapis');
    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

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
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/apps.groups.settings'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        resource: patch,
        groupKey: group,
        groupUniqueId: group
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
        series([
            function patchGroup(patchGroupCallback) {
                directory.groups.patch(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        patchGroupCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    patchGroupCallback(null, result);
                });
            },
            function patchGroupSettings(patchGroupSettingsCallback) {
                groupssettings.groups.patch(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        patchGroupSettingsCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    patchGroupSettingsCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.res = {
                    status: 500,
                    body: err
                };
                context.done(err);
                return;
            } else {
                var patched_group = Object.assign(results[0], results[1]);
                var message = "Patched group "+ patched_group.email;
                var event_type = "ca.wrdsb.igor.google_group.patch";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/group/${patched_group}/patch`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/group_patch-event.json",
                    extensions: { 
                        label: "IGOR patches Google Group", 
                        tags: [
                            "igor", 
                            "google_group",
                            "google_groups",
                            "patch"
                        ] 
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: patched_group,
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
