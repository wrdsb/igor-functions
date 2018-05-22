module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    // parse request params
    context.log('Requested return_type: ' + data.return_type);
    var return_type = data.return_type;
    if (!return_type) { return_type = 'array' }
    context.log('Using return_type: ' + return_type);

    // stores our Groups in the end; one result for objects, another for arrays
    var groups_all_object = {};
    var groups_all_array = [];

    // the data we'll return as 'res' body
    var res_body;

    var google = require('googleapis');
    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

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
        customer: process.env.CUSTOMER_ID,
        maxResults: 200
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
        getGroups(params, function() {
            var message = 'Final results: Got ' + groups_all_array.length + ' groups.';
            var event_type = "ca.wrdsb.igor.google_group.list";
            var flynn_event = {
                eventID: `${event_type}-${context.executionContext.invocationId}`,
                eventType: event_type,
                source: `/google/groups`,
                schemaURL: "https://mcp.wrdsb.io/schemas/igor/group_list-event.json",
                extensions: { 
                    label: "IGOR lists Google Groups",
                    tags: [
                        "igor",
                        "google_group",
                        "google_groups",
                        "list"
                    ]
                },
                data: {
                    function_name: context.executionContext.functionName,
                    invocation_id: context.executionContext.invocationId,
                    payload: {
                        blobs: [
                            {
                                name: "all-groups-array",
                                storage_account: "wrdsb-igor_STORAGE",
                                path: "groups-lists/all-groups-array.json"
                            },
                            {
                                name: "all-groups-object",
                                storage_account: "wrdsb-igor_STORAGE",
                                path: "groups-lists/all-groups-object.json"
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

            context.bindings.allGroupsArrayBlob = groups_all_array;
            context.bindings.allGroupsObjectBlob = groups_all_object;

            switch (return_type) {
                case 'all_groups_array':
                    res_body = flynn_event.data;
                    res_body.payload.groups = groups_all_array;
                    break;
                case 'all_groups_object':
                    res_body = flynn_event.data;
                    res_body.payload.groups = groups_all_object;
                    break;
                default:
                    res_body = flynn_event.data;
                    res_body.payload.groups = groups_all_array;
            }

            context.res = {
                status: 200,
                body: res_body
            };

            context.log(message);
            context.done(null, message);
        });
    });

    function getGroups(params, callback) {
        directory.groups.list(params, function(err, result) {
            if (err) {
                context.res = {
                    status: 500,
                    body: err
                };
                context.done(err);
                return;
            }

            context.log('Got ' + result.groups.length + ' groups.');

            result.groups.forEach(function(group) {
                groups_all_object[group.email] = group;
                groups_all_array.push(group);
            });

            if (result.nextPageToken) {
                params.pageToken = result.nextPageToken;
                getGroups(params, callback);
            } else {
                callback();
            }

        });
    }
};
