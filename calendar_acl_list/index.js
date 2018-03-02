module.exports = function (context, data) {
    var calendar_to_list = data.calendar;

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log('List memberships for calendar ' + calendar_to_list);

    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

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
        calendarId: calendar_to_list,
        maxResults: 250
    };

    var members = {};

    var memberships = {};
    memberships.id = calendar_to_list;
    memberships.actual = [];

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.done(err);
            return;
        }
        getMembers(params, function() {
            if (Object.getOwnPropertyNames(members)) {
                context.log('Final results: Got ' + Object.getOwnPropertyNames(members).length + ' members for ' + calendar_to_list);
            }
            context.res = {
                status: 200,
                body: memberships
            };
            context.done(null, JSON.stringify(memberships));
        });
    });

    function getMembers(params, callback) {
        calendar.acl.list(params, function (err, result) {
            if (err) {
                context.log(result);
                context.done(err);
            }
            if (result.items) {
                context.log('Got ' + result.items.length + ' more members for ' + calendar_to_list);
                result.items.forEach(function(member) {
                    members[member.scope.value] = member;
                    memberships.actual.push(member);
                });
            } else { 
                context.log('Got 0 members for ' + calendar_to_list);
            }
            if (result.nextPageToken) {
                params.pageToken = result.nextPageToken;
                getMembers(params, callback);
            } else {
                callback();
            }
        });
    }
};
