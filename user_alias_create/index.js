module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    // Array to store messages being sent to Flynn Grid
    var events = [];

    var alias_to_create = data;
    var user_key = alias_to_create.userKey;
    var user_alias = alias_to_create.alias;

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log(`Create alias ${user_alias} for user ${user_key}`);

    var series = require('async/series');

    var google = require('googleapis');
    var directory = google.admin('directory_v1');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    // *sigh* because Azure Functions application settings can't handle newlines, let's add them ourselves:
    private_key = private_key.split('\\n').join("\n");

    // stores our member in the end
    var alias_created = {};

    // prep our credentials for G Suite APIs
    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/admin.directory.user','https://www.googleapis.com/auth/admin.directory.user.alias'], // an array of auth scopes
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        alias: alias_to_create,
        userKey: user_key
    };

    jwtClient.authorize(function(err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function createAlias(createAliasCallback) {
                directory.users.aliases.insert(params, function (err, result) {
                    if (err) {
                        if (err.code == 409) {
                            result = 'Alias ' + user_alias + ' already exists.';
                            context.log(result);
                            createAliasCallback(null, result);
                            return;
                        }
                        createAliasCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    createAliasCallback(null, result);
                });
            }
        ],
        function (err, results) {
            if (err) {
                context.done(err);
            } else {
                var message = `Created alias ${user_alias} for user ${user_key}`;
                var event_type = "ca.wrdsb.igor.user_alias.create";
                var flynn_event = {
                    eventID: `${event_type}-${context.executionContext.invocationId}`,
                    eventType: event_type,
                    source: `/google/user/${user_key}/alias/create`,
                    schemaURL: "https://mcp.wrdsb.io/schemas/igor/user_alias_create-event.json",
                    extensions: { 
                        label: "IGOR creates User Alias", 
                        tags: [
                            "igor", 
                            "user",
                            "users",
                            "user_aliases",
                            "users_aliases",
                            "create"
                        ] 
                    },
                    data: {
                        function_name: context.executionContext.functionName,
                        invocation_id: context.executionContext.invocationId,
                        payload: results[0],
                        message: message
                    },
                    eventTime: execution_timestamp,
                    eventTypeVersion: "0.1",
                    cloudEventsVersion: "0.1",
                    contentType: "application/json"
                };
                events.push(JSON.stringify(flynn_event));

                context.res = {
                    status: 200,
                    body: flynn_event.data
                };

                context.log(message);
                context.done(null, message);
            }
        });
    });
};
