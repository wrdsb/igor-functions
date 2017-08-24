module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var calendar_list_entry_params = message.params;
    var calendar_user = message.user;
    context.log('For user ' + calendar_user + ' create list entry: ');
    context.log(calendar_list_entry_params);
    
    // stores our calendar list entry in the end
    var calendar_list_entry_created = {};

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

        // specify we want JSON back from the API.
        // Group Settings API defaults to XML (or Atom), despite the docs
        alt: "json",

        // the Calendar List Entry to create
        resource: calendar_list_entry_params.resource,
        colorRgbFormat: calendar_list_entry_params.colorRgbFormat
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createCalendarListEntry(createCalendarListEntryCallback) {
                calendar.calendarList.insert(params, function (err, result) {
                    if (err) {
                        createCalendarListEntryCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createCalendarListEntryCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                calendar_list_entry_created = results[0];
                context.log(calendar_list_entry_created);
                context.done();
            }
        });
    });
};
