module.exports = function (context, message) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var group_email = message.group.email;
    context.log('Delete group: ' + group_email);

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

        // specify we want JSON back from the API.
        // Group Settings API defaults to XML (or Atom), despite the docs
        alt: "json"
    };


    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        directory.groups.delete(
            params,
            function(err, result) {
                if (err) { 
                    context.log(result);
                    context.done(err);
                } else {
                    context.log(result);
                    context.done();
                }
            }
        );
    });
};
