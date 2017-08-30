module.exports = function (context, message) {
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

    var member_to_create = message;
    context.log('Create membership for ' + member_to_create.email + ' in group ' + member_to_create.groupKey);
    
    // stores our member in the end
    var member_created = {};

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/admin.directory.group.member'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,

        // specify we want JSON back from the API.
        // Group Settings API defaults to XML (or Atom), despite the docs
        alt: "json",

        // the member to create
        resource: member_to_create,
        groupKey: member_to_create.groupKey
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createMember(createMemberCallback) {
                directory.members.insert(params, function (err, result) {
                    if (err) {
                        createMemberCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createMemberCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                member_created = results[0];
                context.log(member_created);
                context.done();
            }
        });
    });
};
