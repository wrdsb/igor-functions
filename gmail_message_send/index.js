module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.gmail('v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var user_id = message.user_id;
    //var resource = message.resource;
    //var media = message.media;
    //var media_mime_type = message.media_mime_type;
    //var media_body = message.media_body;

    //https://github.com/google/google-api-nodejs-client/blob/master/apis/gmail/v1.ts
    //Params are different to what's listed in
    //https://developers.google.com/gmail/api/v1/reference/users/messages/send

    context.log('Sending email from' + user_id + ' to ');

    // stores our calendar in the end
    var user_message_sent = {};

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/gmail.send'],
        user_address
    );

    //message/rfc822
    //https://www.npmjs.com/package/internet-message
    //old example?
    //https://stackoverflow.com/questions/34546142/gmail-api-for-sending-mails-in-node-js
    /*
    function makeBody(to, from, subject, message) {
        var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
            "MIME-Version: 1.0\n",
            "Content-Transfer-Encoding: 7bit\n",
            "to: ", to, "\n",
            "from: ", from, "\n",
            "subject: ", subject, "\n\n",
            message
        ].join('');

        var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
        return encodedMail;
    }

    var raw = makeBody(user_id, 'james_schumann@wrdsb.ca', 'Function test', 'test message');*/

    var params = {
        auth: jwtClient,
        alt: "json",
        userId: user_id,
        resource: resource,
        //media: media
        //media.mimeType: media_mime_type,
        //media.body: media_body
    };

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
                //https://www.npmjs.com/package/rfc822-json
                    user_message_sent = results[0];
                    context.log('Message succesfully sent: ' + user_message_sent);
                    context.done();
                }
            });
    });
};
