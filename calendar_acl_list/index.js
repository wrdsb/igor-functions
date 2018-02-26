module.exports = function (context, data) {
    var google = require('googleapis');
    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    context.log('List Calendar ACLs for calendar ' + data.calendar);

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
        calendarId: data.calendar,
        maxResults: 250
    };

    var members = {};
    var memberships = {};
    memberships.id = data.calendar;
    memberships.actual = [];

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.done(err);
        } else {
            calendar.acl.list(params, function (err, result) {
                if (err) {
                    context.log(result);
                    context.done(err);
                } else {
                    result.items.forEach(function(member) {
                        members[member.scope.value] = member;
                        memberships.actual.push(member);
                    });
                    context.log('Final results: Got ' + Object.getOwnPropertyNames(members).length + ' members for ' + data.calendar);
                    context.res = {
                        status: 200,
                        body: memberships
                    };
                    context.done(null, JSON.stringify(memberships));
                }
            });
        }
    });
};
