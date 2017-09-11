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
    var groups = {};
    var admin_created_groups = {};

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        getGroups(params, function() {
           context.log('Final results: Got ' + Object.getOwnPropertyNames(groups).length + ' groups.');
           context.bindings.allGroups = JSON.stringify(groups);
           context.bindings.adminCreatedGroups = JSON.stringify(admin_created_groups);
           context.done();
        });
    });

    function getGroups(params, callback) {
        directory.groups.list(params, function(err, result) {
            if (err) {
                context.log(result);
                context.done(err);
            }
            context.log(result);
            context.log('Got ' + result.groups.length + ' groups.');
            result.groups.forEach(function(group) {
                groups[group.email] = group;
                if (group.adminCreated) {
                    admin_created_groups[group.email] = group;
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
