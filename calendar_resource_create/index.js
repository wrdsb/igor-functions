module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_resource_to_create = message.resource;
    var memberKey = message.member_id;
    context.log('Create ' + calendar_resource_to_create + ' calendar resource for ' + memberKey);

    var calendar_resource_created = {};

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
        resource: calendar_resource_to_create,
        customer: memberKey
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createCalendarResource(createCalendarResourceCallback) {
                directory.resources.calendars.insert(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        createCalendarResourceCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createCalendarResourceCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    calendar_resource_created = results[0];
                    context.log(calendar_resource_created);
                    context.done();
                }
            });
    });
};

