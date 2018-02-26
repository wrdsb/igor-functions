module.exports = function (context, data) {
    var series = require('async/series');

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igorbot@igor-168712.iam.gserviceaccount.com';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var calendar_acl_to_create = data.acl;
    var calendar_id = data.calendar_id;
    context.log('Create ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id);

    // stores our calendar in the end
    var calendar_acl_created = {};

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        resource: calendar_acl_to_create,
        calendarId: calendar_id
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createCalendarAcl(createCalendarAclCallback) {
                calendar.acl.insert(params, function (err, result) {
                    if (err) {
                        context.log('Unable to create ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id);
                        createCalendarAclCallback(new Error(err));
                        return;
                    }
                    // context.log(result); - TODO - log this instead
                    createCalendarAclCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                calendar_acl_created = results[0];
                context.log('Created ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id);
                context.res = {
                    status: 200,
                    body: 'Created ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id
                };
                context.done(null, 'Created ' + calendar_acl_to_create.role + ' ACL for ' + calendar_acl_to_create.scope.value + ' on ' + calendar_id);
            }
        });
    });
};
