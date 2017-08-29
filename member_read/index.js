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

    var member_to_read = message;
    context.log('Read membership for ' + member_to_create.email + ' in group ' + member_to_create.groupKey);

    var member_read = {};

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.group', 'https://www.googleapis.com/auth/admin.directory.group.member'],
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        memberKey: member_to_read.email,
        groupKey: member_to_read.groupKey,
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function readMember(readMemberCallback) {
                directory.members.get(params, function (err, result) {
                    if (err) {
                        readMemberCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    readMemberCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    member_read = results[0];
                    context.log(member_read);
                    //Congrats you read it but what do you want to do?
                    context.done();
                }
            });
    });
};
