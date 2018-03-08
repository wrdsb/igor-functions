module.exports = function (context, data) {
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
            context.log('Final results: Got ' + groups_all_array.length + ' groups.');

            context.bindings.groupsAllObject = JSON.stringify(groups_all_object);
            context.bindings.groupsAllArray = JSON.stringify(groups_all_array);

            switch (return_type) {
                case 'all_groups_array':
                    res_body = groups_all_array;
                    break;
                case 'all_groups_object':
                    res_body = groups_all_object;
                    break;
                default:
                    res_body = groups_all_array;
            }

            context.res = {
                status: 200,
                body: res_body
            };

            context.done(null, 'Final results: Got ' + groups_all_array.length + ' groups.');
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
