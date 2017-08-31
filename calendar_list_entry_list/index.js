module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var calendar_user = message.user;
    context.log('For user ' + calendar_user + ' list calendars: ');

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'], // an array of auth scopes
        calendar_user
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        maxResults: 250
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function listCalendarListEntry(listCalendarListEntryCallback) {
                calendar.calendarList.list(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        listCalendarListEntryCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    listCalendarListEntryCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                var topic_message = {
                    'function': 'calendar_list_entry_list',
                    'user': calendar_user,
                    'result': results[0]
                };
                context.log(JSON.stringify(topic_message));
                context.bindings.resultBlob = JSON.stringify(topic_message);
                context.done(null, topic_message);
            }
        });
    });
};
