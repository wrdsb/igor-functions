module.exports = function (context, data) {
    var member_to_update = data;

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log('Update membership for '+ member_to_update.email +' in group '+ member_to_update.groupKey +' to role '+ member_to_update.role);

    var google = require('googleapis');
    var directory = google.admin('directory_v1');

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
        ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/admin.directory.group.member'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        memberKey: member_to_update.email,
        groupKey: member_to_update.groupKey,
        resource: {
            role: member_to_update.role
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
                context.done(null, 'Updated membership for '+ member_to_update.email +' in group '+ member_to_update.groupKey +' to role '+ member_to_update.role);
                return;
            }
        });
    });
};
