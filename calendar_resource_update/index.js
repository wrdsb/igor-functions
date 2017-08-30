module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_resource_to_update = message.resource;
    var memberKey = message.member_id;
    var calendar_id = message.calendar_id;
    context.log('Update ' + calendar_resource_to_update + ' calendar resource for ' + memberKey);

    var calendar_resource_updated = {};

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.resource.calendar'],
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        resource: calendar_resource_to_update,
        customer: memberKey,
        calendarResourceId: calendar_id
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function updateCalendarResource(updateCalendarResourceCallback) {
                directory.resources.calendars.update(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        updateCalendarResourceCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    updateCalendarResourceCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    calendar_resource_updated = results[0];
                    context.log(calendar_resource_updated);
                    context.done();
                }
            });
    });
};

