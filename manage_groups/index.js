module.exports = function (context, message) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');
    var groupssettings = google.groupssettings('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    var user_address = message.user_address;
    var group_address = message.group_address;

    user_address = 'igor@googleapps.wrdsb.ca';
    group_address = 'software-development@googleapps.wrdsb.ca';

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key, ['https://www.googleapis.com/auth/admin.directory.group','https://www.googleapis.com/auth/apps.groups.settings'], // an array of auth scopes
        user_address
    );

    // var options = {};

    read_group(group_address);
    context.done();

    function read_group(group_address) {
        context.log('Read Group');

        var params = {
            auth: jwtClient,
            
            // used by Groups (Directory) API 'GET'
            groupKey: group_address,
    
            // same as groupKey, but used by Groups Settings (G Suite Admin SDK) API 'GET'
            // because, you know, why standardize the name of our unique identifier?
            groupUniqueId: group_address,
        };

        jwtClient.authorize(function(err, tokens) {
            if (err) {
                context.log(err);
                return;
            }
    
            directory.groups.get(
                params,
                //options,
                function(err, resp) {
                    if (err) {
                        context.log(err);
                        return;
                    }
                    context.log(resp);
                }
            );
    
            groupssettings.groups.get(
                params,
                //options,
                function(err, resp) {
                    if (err) {
                        context.log(err);
                        return;
                    }
                    context.log(resp);
                }
            );
        });
    }

    function create_group(group_address) {
        context.log('Create Group');
    }
};
