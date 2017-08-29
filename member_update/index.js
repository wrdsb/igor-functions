module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var member_to_update = message;
    context.log('Update membership for ' + member_to_create.email + ' in group ' + member_to_create.groupKey);

    var member_updated = {};

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.group', 'https://www.googleapis.com/auth/admin.directory.group.member'],
        user_address
    );

    //resource = {"email": "", "etag": "", "id": "", "kind": "admin#directory#member", "role": "", "status": "", "type": ""}
    //Pass Members Resource with the following properties: role
    var params = {
        auth: jwtClient,
        alt: "json",
        memberKey: member_to_update.email,
        groupKey: member_to_update.groupKey,
        resource: member_to_update
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function updateMember(updateMemberCallback) {
                directory.members.update(params, function (err, result) {
                    if (err) {
                        updateMemberCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    updateMemberCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    member_updated = results[0];
                    context.log(member_updated);
                    context.done();
                }
            });
    });
};
