module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var base64url = require('base64url')
    var googleAuth = require('google-oauth-jwt');
    var gmail = google.gmail('v1');

    var user_address = process.env.client_email;

    var user_id = 'me';
    var to = message.to;
    var fromperson = message.from;
    var subject = message.subject;
    var body = message.body;
    var token = message.access_token;
    context.log('to:' + to);
    context.log('fromperson:' + fromperson);
    context.log('subject:' + subject);
    context.log('body:' + body);
    context.log('access_token:' + token);

    var scopes = ['https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send'
    ];

    var OAuth2 = google.auth.OAuth2;

    function generateOAuthClient() {
        var OAuth2 = google.auth.OAuth2;
        var client = new OAuth2(
            process.env.gmail_client_id,
            process.env.gmail_client_secret,
            ''
        );

        client.setCredentials({
            access_token: token
        });

        return client;
    }

    function createEmail(to, fromperson, subject, body) {
        let email = [
            "to: ", to, "\n",
            "from: ", fromperson, "\n",
            "subject: ", subject, "\n\n",
            body
        ].join('');
        return base64url(new Buffer(email).toString('utf8'));
    }

    function sendMail(raw, oauth2Client) {
        context.log('raw: ' + raw);
        context.log('oauth2client:' + oauth2Client);
        var params = {
            userId: user_id,
            resource: { 'raw': raw },
            auth: oauth2Client
        };

        gmail.users.messages.send(params, function (err, result) {
            if (err) {
                context.log(result);
                context.log(err);
                return;
            }
            context.log(result);
        });
    }
    var oauth2Client = generateOAuthClient();
    var raw_email = createEmail(to, fromperson, subject, body);
    sendMail(raw_email, oauth2Client);


    //Failure #1 to get OAuth2 Token
    /*
    function getToken(){
        googleAuth.authenticate({
            email: user_address,
            keyFile: 'D:\\home\\site\\wwwroot\\gmail_message_send\\gmail-client.pem',
            scopes: scopes
        }, function (err, token) {
            if (err) {
                context.log(err);
            }
            context.log('Token:' + token);
            return token;
        });
    }*/

    // Failure #2 to get OAuth2 Token
    /*
    //npm install json-web-token --save
    //https://www.npmjs.com/package/json-web-token
    var jsonWebToken = require("json-web-token")
    var secrent = process.env.private_key;
    var payload = encodedHeader + "." encodedClaim;
    var signature = generateSignature();

    // encode
    function generateSignature(){
    jsonWebToken.encode(secret, payload, function (err, token) {
      if (err) {
        console.error(err.name, err.message);
      } else {
        console.log(token);
        }
    });
    }

    var encodedSignature = base64url(new Buffer(signature).toString('utf8'));

    //npm install jsonwebtoken
    //code to generate signature, might be cleaner/better
    var jwt = require('jsonwebtoken');

    var payload = "";
    var secret = "";

    var signature = jwt.sign({
      data: payload
    }, secret, { algorithm: 'RS256' });*/

    //Failure #3 to get OAuth2 Token, got furthest with is one before switching to .Net Client for retrieving Token
    //everything below is from this: https://developers.google.com/identity/protocols/OAuth2ServiceAccount#creatingjwt

    //Lets set the header values, json them, then encode them
    /*
    var pHeader = { "alg": "RS256", "typ": "JWT" }
    var sHeader = JSON.stringify(pHeader);
    var encodedsHeader = base64url(new Buffer(sHeader).toString('utf8'));
    context.log('encodedHeader:' + encodedsHeader);


    var date = Math.round(new Date().getTime() / 1000);
    var expirary = date + 3600;

    context.log('date: ' + date);
    context.log('expires: ' + expirary);

    var pClaim = {};
    pClaim.aud = "https://www.googleapis.com/oauth2/v4/token";
    pClaim.scope = "https://www.googleapis.com/auth/gmail.send";
    pClaim.iss = user_address;
    pClaim.exp = expirary;
    pClaim.iat = date;

    var sClaim = JSON.stringify(pClaim);
    context.log('sclam: ' + sClaim);
    var encodedsClaim = base64url(new Buffer(sClaim).toString('utf8'));
    context.log('encoded claim: ' + encodedsClaim);

    var private_key = process.env.private_key;
    private_key = private_key.split('\\n').join("\n");
    context.log('private key: ' + private_key);

    //spec for signature: https://tools.ietf.org/html/draft-jones-json-web-signature-04#page-5
    //node lib for generating signature: https://www.npmjs.com/package/json-web-token
    //maybe the whole package here: https://www.jsonwebtoken.io/
    var signature = "";

    var encodedSignature = base64url(new Buffer(signature).toString('utf8'));
    context.log('encodedSignature: ' + encodedSignature);

    var encoded_jwt = encodedsHeader + '.' + encodedsClaim + '.' + encodedSignature;
    context.log('encoded_jwt: ' + encoded_jwt);

    var request = require('request');

    var grant_type = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
    var encoded_grant_type = base64url(new Buffer(grant_type).toString('utf8'));
    //doc says this value needs to be encoded but google was rejecting it unless it was plaintext
    context.log('encoded grant: ' + encoded_grant_type);

    // Set the headers
    var headers = {
        'HTTP-Version': 'HTTP/1.1',
        'Content-Type': 'application/x-www-form-urlencoded'//,
        //'access_type': 'offline'
    }

    var bodyOptions = { 'grant_type': "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: encoded_jwt }

    // Configure the request
    var options = {
        url: 'https://www.googleapis.com/oauth2/v4/token',
        method: 'POST',
        headers: headers,
        form: bodyOptions,
        json: true
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log(body)
        }
        else {
            context.log(error);
            context.log(response);
        }
    });*/
};