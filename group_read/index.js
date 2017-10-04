module.exports = function (context, message) {
    context.log(message);
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var group_email = JSON.parse(message.body).group;
    if (!group_email) {
        context.done('Group email missing.');
        return;
    }
    context.log('Read group: ' + group_email);
    
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
        groupKey: group_email,

        // same as groupKey, but used by Groups Settings (G Suite Admin SDK) API 'GET'
        // because, you know, why standardize the name of our unique identifier?
        groupUniqueId: group_email,

        // specify we want JSON back from the API.
        // Group Settings API defaults to XML (or Atom), despite the docs
        alt: "json"
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
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
                context.done(err);
            } else {
                group = Object.assign(results[0], results[1]);
                context.log(group);
                context.bindings.resultBlob = JSON.stringify(group);
                context.done(null, JSON.stringify(group));
            }
        });
    });
};
