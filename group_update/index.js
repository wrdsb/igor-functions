module.exports = function (context, data) {
    var group_to_update = data.group;
    context.log('Update group: ' + group_to_update);
    
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
    var group_updated = {};

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

        // specify we want JSON back from the API.
        // Group Settings API defaults to XML (or Atom), despite the docs
        alt: "json",

        // the Group to update
        resource: group_to_update,
        groupKey: group_to_update.email,
        groupUniqueId: group_to_update.email
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
            function updateGroup(updateGroupCallback) {
                directory.groups.update(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        updateGroupCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    updateGroupCallback(null, result);
                });
            },
            function updateGroupSettings(updateGroupSettingsCallback) {
                groupssettings.groups.update(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        updateGroupSettingsCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    updateGroupSettingsCallback(null, result);
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
                group_updated = Object.assign(results[0], results[1]);
                context.res = {
                    status: 200,
                    body: JSON.stringify(group_updated)
                };
                context.done(null, group_updated);
            }
        });
    });
};
