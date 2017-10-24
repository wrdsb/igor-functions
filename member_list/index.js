module.exports = function (context, data) {
    var google = require('googleapis');
    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var group_to_list = data.group;
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
        maxResults: 200
    };

    var members = {};

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        getMembers(params, function() {
            if (Object.getOwnPropertyNames(members)) {
                context.log('Final results: Got ' + Object.getOwnPropertyNames(members).length + ' members for ' + group_to_list);
            }
            context.bindings.resultBlob = JSON.stringify(members);
            context.done();
        });
    });

    function getMembers(params, callback) {
        directory.members.list(params, function (err, result) {
            if (err) {
                context.log(result);
                context.done(err);
            }
            if (result.members) {
                context.log('Got ' + result.members.length + ' more members for ' + group_to_list);
                result.members.forEach(function(member) {
                    members[member.email] = member;
                });
            } else {
                context.log('Got 0 members for ' + group_to_list);
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
