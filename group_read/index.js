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

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key, ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/apps.groups.settings'], // an array of auth scopes
        user_address
    );

    // var options = {};

    var params = {
        auth: jwtClient,
        
        // used by Groups (Directory) API 'GET'
        groupKey: group_email,

        // same as groupKey, but used by Groups Settings (G Suite Admin SDK) API 'GET'
        // because, you know, why standardize the name of our unique identifier?
        groupUniqueId: group_email,
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }

        directory.groups.get(
            params,
            //options,
            function(err, resp) {
                if (err) {
                    context.log(err);
                    return;
                }
                context.log(resp);
            }
        );

        groupssettings.groups.get(
            params,
            //options,
            function(err, resp) {
                if (err) {
                    context.log(err);
                    return;
                }
                context.log(resp);
            }
        );
    });

    context.done();
};
