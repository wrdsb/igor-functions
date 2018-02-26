module.exports = function (context, data) {
    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_acl_to_update = data.acl;
    var calendar_id = data.calendar_id;
    var rule_id = data.rule_id;

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
        calendar.acl.update(params, function (err, result) {
            if (err) {
                context.done(err);
                return;
            }
            context.log(result);
            calendar_acl_updated = result;
            context.log(calendar_acl_updated);
            context.res = {
                status: 200,
                body: calendar_acl_updated
            };
            context.done();
        });
    });
};
