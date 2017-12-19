module.exports = function (context, data) {
    var calendar_to_create = data.calendar;
    context.log(calendar_to_create);

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';
    private_key = private_key.split('\\n').join("\n");

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
        resource: calendar_to_create
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.done(err);
            return;
        }
        calendar.calendars.insert(params, function (err, result) {
            if (err) {
                context.done(err);
                return;
            }
            context.log(result);
            context.done(null, result);
        });
    });
};
