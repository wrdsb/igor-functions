module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    //var googleAuth = require('google-auth-library');
    var base64url = require('base64url')

    var gmail = google.gmail('v1');

    var googleAuth = require('google-oauth-jwt');
    var request = require('request');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'get igor true @ value';

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
            keyFile: 'D:\\home\\site\\wwwroot\\gmail_message_send\\gmail-client.pem',
            // specify the scopes you wish to access
            scopes: scopes
        }, function (err, token) {
            if (err) {
                context.log(err);
            }
            else {
                context.log('This is the token: ' + token);
                var base64_encoded_email = createEmail(to, from, subject, message);
                context.log('This is your raw email: ' + base64_encoded_email);
                //was hard coding token for testing:
                //get it here(Step 2 Access Token: ): https://developers.google.com/oauthplayground
                sendMail('', base64_encoded_email);
            }
        });
    }

    getToken();

    var to = message.to;
    var from = message.from;
    var subject = message.subject;
    var message = message.body;
    var base64_encoded_email = createEmail(to, from, subject, message);


    function createEmail(to, from, subject, message) {
        let email = ["Content-Type:  text/plain; charset=\"UTF-8\"\n",
            "Content-length: 5000\n",
            "Content-Transfer-Encoding: message/rfc2822\n",
            "to: ", to, "\n",
            "from: ", from, "\n",
            "subject: ", subject, "\n\n",
            message
        ].join('');

        return new Buffer(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    }
    
    function sendMail(oauth2token, raw) {
        context.log('Function Token: ' + oauth2token);
        context.log('Function raw: ' + raw);

        var params = {
            userId: user_id,
            resource: { 'raw': raw }
        };

        var headers = {
            "HTTP-Version": "HTTP/1.1",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + oauth2token
        };
        
        var options = {
            headers: headers,
            url: "https://www.googleapis.com/gmail/v1/users/me/messages/send",
            method: "POST",
            params: params
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                context.log(body);
            }
            if (error) {
                context.log(error);
            }
            else {
                context.log(response);
            }
        })
    }
};
