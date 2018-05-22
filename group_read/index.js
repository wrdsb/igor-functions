module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    // TODO: error handling for missing/malformed group email address
    var group_id = data.group;
    // TODO send error to grid for handling
    if (!group_id) {
        context.done('Group email missing.');
        return;
    }
    context.log('Read group: ' + group_id);
    
    var series = require('async/series');

    var google = require('googleapis');
    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // stores our Group in the end
    var group = {};

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
        
        // used by Groups (Directory) API 'GET'
        groupKey: group_id,

        // same as groupKey, but used by Groups Settings (G Suite Admin SDK) API 'GET'
        // because, you know, why standardize the name of our unique identifier?
        groupUniqueId: group_id,

        // specify we want JSON back from the API.
        // Group Settings API defaults to XML (or Atom), despite the docs
        alt: "json"
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            // TODO send error to grid for handling
            context.res = {
                status: 500,
                body: err
            };
            context.done(err);
            return;
        }
        series([
            function getGroup(getGroupCallback) {
                directory.groups.get(params, function(err, result) {
                    if (err) {
                        context.log(result);
                        getGroupCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    getGroupCallback(null, result);
                });
            },
            function getGroupSettings(getGroupSettingsCallback) {
                groupssettings.groups.get(params, function(err, result) {
                    if (err) {
                        context.log(result);
                        getGroupSettingsCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    getGroupSettingsCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                // TODO send error to grid for handling
                context.res = {
                    status: 500,
                    body: err
                };
                context.done(err);
                return;
            } else {
                var group_object = Object.assign(results[0], results[1]);
                var message = 'Successfully read group ' + group_id;
                var event_type = "ca.wrdsb.igor.google_groups.read";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/group/${group_id}`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/group_read-event.json",
                    extensions: {
                        label: "IGOR reads Google Group",
                        tags: [
                            "igor",
                            "google_group",
                            "google_groups",
                            "read"
                        ]
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: {
                            group: group_object,
                            blobs: [
                                {
                                    name: group_id,
                                    storage_account: "wrdsb-igor_STORAGE",
                                    path: `groups-groups/${group_id}.json`
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

                context.bindings.outputBlob = group_object

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
