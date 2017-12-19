module.exports = function (context, data) {
    context.res = data;
    context.done(null, data);
};
