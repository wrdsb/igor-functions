module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_id = message.calendar_id;
    var rule_id = message.rule_id;
    var calendar_acl_read = {};

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'],
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: json,
        calendarId: calendar_id,
        ruleId: rule_id
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function readCalendarAcl(readCalendarAclCallback) {
                calendar.acl.get(params, function (err, result) {
                    if (err) {
                        readCalendarAclCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    readCalendarAclCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    calendar_acl_read = results[0];
                    //We got the ACL but what do you want to do with it?
                    //Currently just logs it
                    context.log(calendar_acl_read);
                    context.done();
                }
            });
    });
};