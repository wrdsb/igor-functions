module.exports = function (context, data) {

    context.log(context.executionContext.functionName + ': ' + context.executionContext.invocationId);
    context.log(data);

    context.done();
};
