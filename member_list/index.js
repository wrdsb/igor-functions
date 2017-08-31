module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var group_to_list = message.groupKey;
    context.log('List memberships for group ' + group_to_list);
    
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
        groupKey: group_to_list,
        maxResults: 20000
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function listMember(listMemberCallback) {
                directory.members.insert(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        listMemberCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    listMemberCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                var topic_message = {
                    'function': 'member_list',
                    'groupKey': group_to_list,
                    'result': results[0]
                };
                context.log(JSON.stringify(topic_message));
                context.bindings.resultBlob = JSON.stringify(topic_message);
                context.done(null, topic_message);
            }
        });
    });
};
