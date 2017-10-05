module.exports = function (context, message) {
    context.log('Receiving Bot message', message);

    var response = {
        'text': message.text,
        'address': message.address
    };

    context.done(null, response);
};