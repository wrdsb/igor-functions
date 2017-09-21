module.exports = function (context, message) {
    context.log();

    var request = require('request');
    var slack_url = process.env.slack_url;
    var payload = {
        "username": "IGOR",
        "text": context.bindings.message
    };
        
    var requestData = {
        url: slack_url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: payload
    };
        
    request(requestData);
    context.res = {
        status: 200
    };
    context.done();
};