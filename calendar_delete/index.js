module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_to_delete = message;
    context.log(calendar_to_delete);

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
        calendarId: calendar_to_delete
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function deleteCalendar(deleteCalendarCallback) {
                calendar.calendars.delete(params, function (err, result) {
                    if (err) {
                        deleteCalendarCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    deleteCalendarCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    //Success: Empty Response Body
                    context.done();
                }
            });
    });
};
