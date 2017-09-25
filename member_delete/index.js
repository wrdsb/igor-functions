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

    var member_to_delete = message;
    context.log('Delete membership for ' + member_to_delete.email + ' in group ' + member_to_delete.groupKey);

    // stores our member in the end
    var member_deleted = {};

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
        alt: "json",
        memberKey: member_to_delete.email,
        groupKey: member_to_delete.groupKey
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function deleteMember(deleteMemberCallback) {
                directory.members.delete(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        deleteMemberCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    deleteMemberCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    //Success: Empty Response Body
                    context.log('Deleted membership for ' + member_to_delete.email + ' in group ' + member_to_delete.groupKey);
                    context.done(null, 'Deleted membership for ' + member_to_delete.email + ' in group ' + member_to_delete.groupKey);
                }
            });
    });
};
