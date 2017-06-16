module.exports = function (context, message) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    var urlshortener = google.urlshortener('v1');

    context.log(context);

    var params = {
        shortUrl: 'http://goo.gl/xKbRu3'
    };

    // get the long url of a shortened url
    urlshortener.url.get(params, function (err, response) {
      if (err) {
          context.log('Encountered error', err);
      } else {
          context.log('Long url is', response.longUrl);
      }
    });

    context.done();
};
