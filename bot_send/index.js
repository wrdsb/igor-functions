module.exports = function (context, message) {
    context.log('Sending Bot message', message);

    var response = {
        'text': message.text,
        'address': message.address
    };

    context.done(null, response);
};