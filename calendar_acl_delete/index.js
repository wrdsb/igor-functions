module.exports = function (context, data) {
    var series = require('async/series');

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@googleapps.wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_acl_to_delete = data.rule_id;
    var calendar_id = data.calendar_id;

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
    	calendarId: calendar_id,
    	ruleId: calendar_acl_to_delete
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function deleteCalendarAcl(deleteCalendarAclCallback) {
                calendar.acl.delete(params, function (err, result) {
                    if (err) {
                        deleteCalendarAclCallback(new Error(err));
                        return;
                    }
                    deleteCalendarAclCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                context.log('Deleted ' + calendar_acl_to_delete + ' ACL on ' + calendar_id);
                context.res = {
                    status: 200,
                    body: 'Deleted ' + calendar_acl_to_delete + ' ACL on ' + calendar_id
                };
                context.done(null, 'Deleted ' + calendar_acl_to_delete + ' ACL on ' + calendar_id);
            }
        });
    });
};