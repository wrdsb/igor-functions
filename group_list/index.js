module.exports = function (context, message) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

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

    // stores our Groups in the end
    var groups_all = {};
    var groups_created_admin = {};
    var groups_created_user = {};

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        getGroups(params, function() {
           context.log('Final results: Got ' + Object.getOwnPropertyNames(groups_all).length + ' groups and ' + Object.getOwnPropertyNames(groups_created_admin).length + ' admin-created groups.');
           context.bindings.groupsAll = JSON.stringify(groups_all);
           context.bindings.groupsCreatedAdmin = JSON.stringify(groups_created_admin);
           context.bindings.groupsCreatedUser = JSON.stringify(groups_created_user);
           context.done();
        });
    });

    function getGroups(params, callback) {
        directory.groups.list(params, function(err, result) {
            if (err) {
                context.log(result);
                context.done(err);
            }
            context.log('Got ' + result.groups.length + ' groups.');
            result.groups.forEach(function(group) {
                groups_all[group.email] = group;
                if (group.adminCreated) {
                    groups_created_admin[group.email] = group;
                } else {
                    groups_created_user[group.email] = group;
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
