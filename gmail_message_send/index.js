module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    var base64url = require('base64url')

    var calendar = google.gmail('v1');

    var request = require('google-oauth-jwt');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igorbot@igor-168712.iam.gserviceaccount.com';

    private_key = private_key.split('\\n').join("\n");

    var user_id = message.user_id;

    //var media = message.media;
    //var media_mime_type = message.media_mime_type;
    //var media_body = message.media_body;

    var scopes = ['https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send'
    ];

    function getToken(){
        googleAuth.authenticate({
            // use the email address of the service account, as seen in the API console
            email: user_address,
            // use the PEM file we generated from the downloaded key
            keyFile: process.env.gmail_pem,
            // specify the scopes you wish to access
            scopes: scopes
        }, function (err, token) {
            console.log(token);
            return token;
        });
    }

    var oauth2token = getToken();
    context.log(oauth2token);

    // stores our response
    var user_message_sent = {};

    /*
    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        scopes,
        user_address
    );*/

    var to = message.to;
    var from = message.from;
    var subject = message.subject;
    var message = message.body;
    var base64_encoded_email = createEmail(to, from, subject, message);

    context.log('Sending email from ' + from + ' to ' + to);

    function createEmail(to, from, subject, message) {
        let email = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
            "MIME-Version: 1.0\n",
            "Content-Transfer-Encoding: 7bit\n",
            "to: ", to, "\n",
            "from: ", from, "\n",
            "subject: ", subject, "\n\n",
            message
        ].join('');

        return base64url(email);
    }

    //context.log(base64_encoded_email);
    //context.log('Client email: ' + client_email);
    //context.log('User Adrs: ' + user_address);

    var params = {
        auth: oauth2token,
        alt: "json",
        userId: user_id,
        resource: {'raw' : base64_encoded_email}
        //media: media
        //media.mimeType: media_mime_type,
        //media.body: media_body
    };


    /*
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function sendGmailMessage(sendGmailMessageCallback) {
                gmail.users.messages.send(params, function (err, result) {
                    if (err) {
                        context.log(result);
                        sendGmailMessageCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    sendGmailMessageCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    user_message_sent = results[0];
                    context.log('Message succesfully sent: ' + user_message_sent);
                    context.done();
                }
            });
    });*/
};
