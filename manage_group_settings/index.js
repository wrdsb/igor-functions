module.exports = function(context, message) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;

    // because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key, ['https://www.googleapis.com/auth/apps.groups.settings', 'https://www.googleapis.com/auth/admin.directory.group'], // an array of auth scopes
        'igor@googleapps.wrdsb.ca'
    );

    var params = {
        auth: jwtClient,
        groupUniqueId: 'software-development@googleapps.wrdsb.ca',
        groupKey: 'software-development@googleapps.wrdsb.ca'
    };

    context.log(params.groupUniqueId);

    // var options = {};

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }

        directory.groups.get(
            params,
            //options,
            function(err, resp) {
                context.log('Group:');
                context.log(err);
                context.log(resp);
            }
        );

        groupssettings.groups.get(
            params,
            //options,
            function(err, resp) {
                context.log('Group Settings:');
                context.log(err);
                context.log(resp);
            }
        );
    });

    context.done();
};
