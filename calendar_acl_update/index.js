module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_acl_to_update = message.acl;
    var calendar_id = message.calendar_id;
    var rule_id = message.rule_id;

    context.log(calendar_acl_to_update);

    var calendar_acl_updated = {};

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'],
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        resource: calendar_acl_to_update,
        ruleId: rule_id,
        calendarId: calendar_id
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function updateCalendarAcl(updateCalendarAclCallback) {
                calendar.acl.update(params, function (err, result) {
                    if (err) {
                        updateCalendarAclCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    updateCalendarAclCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    calendar_acl_updated = results[0];
                    context.log(calendar_acl_updated);
                    context.done();
                }
            });
    });
};
