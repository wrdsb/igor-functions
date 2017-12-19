module.exports = function (context, data) {
    var calendar_user = data.user;
    context.log('For user ' + calendar_user + ' list calendars: ');

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
        calendar_user
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        maxResults: 250
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
        calendar.calendarList.list(params, function (err, result) {
            if (err) {
                context.res = {
                    status: 500,
                    body: err
                };
                context.done(err);
                return;
            }
            context.res = {
                status: 200,
                body: JSON.stringify(result)
            };
            context.done(null, result);
        });
    });
};
