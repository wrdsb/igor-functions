module.exports = function (context, message) {
  var google = require('googleapis');
  var googleAuth = require('google-auth-library');

  var urlshortener = google.urlshortener('v1');

  var jwtClient = new google.auth.JWT(
    process.env['client_email'],
    null,
    process.env['private_key'],
    ['https://www.googleapis.com/auth/urlshortener'], // an array of auth scopes
    null
  );

  var params = {
    auth: jwtClient,
    shortUrl: 'http://goo.gl/xKbRu3'
  };

  jwtClient.authorize(function (err, tokens) {
    if (err) {
      return context.log(err);
    }

    //context.log(context);

    // get the long url of a shortened url
    urlshortener.url.get(params, function (err, response) {
      if (err) {
        context.log('Encountered error', err);
      } else {
        context.log('Long url is', response.longUrl);
      }
    });
  });

  context.done();
};
