module.exports = function (context, message) {
    var google = require('googleapis');

    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    context.log('Update membership for '+ message.memberKey +' in group '+ message.groupKey +' to role '+ message.role);

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/admin.directory.group.member'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        memberKey: message.memberKey,
        groupKey: message.groupKey,
        resource: {
            role: message.role
        }
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        directory.members.update(params, function (err, result) {
            if (err) {
                context.log(result);
                context.done(err);
                return;
            } else {
                context.log(result);
                context.done(null, 'Updated membership for '+ message.memberKey +' in group '+ message.groupKey +' to role '+ message.role);
                return;
            }
        });
    });
};
