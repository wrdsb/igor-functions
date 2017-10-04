module.exports = function (context, functionTimer) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var directory = google.admin('directory_v1');

    var customer = process.env['CUSTOMER_ID'];

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = process.env['client_email'];

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    context.log('List privileges for customer ' + customer);

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.rolemanagement'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        customer: customer
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.done(err);
        } else {
            directory.privileges.list(params, function (err, result) {
                if (err) {
                    context.log(result);
                    context.done(err);
                } else {
                    var topic_message = {
                        'function': 'privilege_list',
                        'result': result
                    };
                    context.log(JSON.stringify(topic_message));
                    context.bindings.resultBlob = JSON.stringify(topic_message);
                    context.done(null, topic_message);
                }
            });
        }
    });
};
