module.exports = function (context, data) {
    // TODO: error handling for missing/malformed group email address
    var group = data.group;
    context.log('Delete group: ' + group);

    var google = require('googleapis');
    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/apps.groups.settings'],
        user_address
    );

    var params = {
        auth: jwtClient,
        groupKey: group,
        alt: "json"
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
        directory.groups.delete(
            params,
            function(err, result) {
                if (err) {
                    context.res = {
                        status: 500,
                        body: err
                    };
                    context.done(err);
                    return;
                } else {
                    context.res = {
                        status: 200,
                        body: "Deleted group " + group
                    };
                    context.done(null, "Deleted group " + group);
                }
            }
        );
    });
};
