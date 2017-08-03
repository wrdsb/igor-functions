module.exports = function (context, message) {
    context.log(message);

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    var group_email     = message.group.email;
    
    // stores our group in the end
    var group = {};

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key, ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/apps.groups.settings'], // an array of auth scopes
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

    function getGroup() {
        return new Promise(function(resolve, reject) {
            directory.groups.get(
                params,
                function(err, res) {
                    if (err) { return reject(err); }
                    return resolve(res);
                }
            );
        });
    }

    function getGroupSettings() {
        return new Promise(function(resolve, reject) {
            groupssettings.groups.get(
                params,
                function(err, res) {
                    if (err) { return reject(err); }
                    return resolve(res);
                }
            );
        });
    }


    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        Promise.all([getGroup(), getGroupSettings()])
            .then(function(groupParts) {
                group = Object.assign(groupParts[0], groupParts[1]);
                context.log(group);
                context.done();
            });
    });
};
