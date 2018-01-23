module.exports = function (context, data) {
    var group_to_patch = data.group;
    context.log('Patch group: ' + group_to_patch);
    
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
    var group_patched = {};

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
        resource: group_to_patch,
        groupKey: group_to_patch.email,
        groupUniqueId: group_to_patch.email
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
                group_patched = Object.assign(results[0], results[1]);
                context.res = {
                    status: 200,
                    body: JSON.stringify(group_patched)
                };
                context.done(null, group_patched);
            }
        });
    });
};
