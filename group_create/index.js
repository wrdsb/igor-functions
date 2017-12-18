module.exports = function (context, data) {
    var group_to_create = data.group;
    context.log('Create group: ' + group_to_create.email);
    
    var series = require('async/series');

    var google = require('googleapis');
    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // stores our group in the end
    var group_created = {};

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

        // the Group to create
        resource: group_to_create,
        groupUniqueId: group_to_create.email
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
            function createGroup(createGroupCallback) {
                directory.groups.insert(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        createGroupCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createGroupCallback(null, result);
                });
            },
            function createGroupSettings(createGroupSettingsCallback) {
                groupssettings.groups.update(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        createGroupSettingsCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createGroupSettingsCallback(null, result);
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
            } else {
                group_created = Object.assign(results[0], results[1]);
                context.res = {
                    status: 200,
                    body: JSON.stringify(group_created)
                };
                context.done(null, group_created);
            }
        });
    });
};
