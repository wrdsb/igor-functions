module.exports = function (context, data) {
    // parse request params
    context.log('Requested return_type: ' + data.return_type);
    var return_type = data.return_type;
    if (!return_type) { return_type = 'stats' }
    context.log('Using return_type: ' + return_type);

    // stores our Groups in the end; one set for objects, another for arrays
    var groups_all_object = {};
    var groups_created_admin_object = {};
    var groups_created_user_object = {};

    var groups_all_array = [];
    var groups_created_admin_array = [];
    var groups_created_user_array = [];

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
            context.log('Final results: Got ' + groups_all_array.length + ' groups and ' + groups_created_admin_array.length + ' admin-created groups.');

            var res_stats = {
                total_groups: groups_all_array.length,
                total_admin_created_groups: groups_created_admin_array.length,
                total_user_created_groups: groups_created_user_array.length
            };

            context.bindings.groupsAllObject = JSON.stringify(groups_all_object);
            context.bindings.groupsCreatedAdminObject = JSON.stringify(groups_created_admin_object);
            context.bindings.groupsCreatedUserObject = JSON.stringify(groups_created_user_object);

            context.bindings.groupsAllArray = JSON.stringify(groups_all_array);
            context.bindings.groupsCreatedAdminArray = JSON.stringify(groups_created_admin_array);
            context.bindings.groupsCreatedUserArray = JSON.stringify(groups_created_user_array);

            context.bindings.groupsStats = JSON.stringify(res_stats);

            switch (return_type) {
                case 'all_groups_array':
                    res_body = JSON.stringify(groups_all_array);
                    break;
                case 'admin_created_groups_array':
                    res_body = JSON.stringify(groups_created_admin_array);
                    break;
                case 'user_created_groups_array':
                    res_body = JSON.stringify(groups_created_user_array);
                    break;
                case 'all_groups_object':
                    res_body = JSON.stringify(groups_all_object);
                    break;
                case 'admin_created_groups_object':
                    res_body = JSON.stringify(groups_created_admin_object);
                    break;
                case 'user_created_groups_object':
                    res_body = JSON.stringify(groups_created_user_object);
                    break;
                case 'stats':
                    res_body = JSON.stringify(res_stats);
                    break;
                default:
                    res_body = JSON.stringify(res_stats);
            }

            context.res = {
                status: 200,
                body: res_body
            };

            context.done(null, 'Final results: Got ' + groups_all_array.length + ' groups and ' + groups_created_admin_array.length + ' admin-created groups.');
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

                if (group.adminCreated) {
                    groups_created_admin_object[group.email] = group;
                    groups_created_admin_array.push(group);
                } else {
                    groups_created_user_object[group.email] = group;
                    groups_created_user_array.push(group);
                }

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
