const formatErr = function (err) {
  var output = {};
  if (err instanceof Error) {
    output = {
      errorMessage: err.message,
      errorType: err.name,
      stackTrace: err.stack.split('\n').slice(1).map(function (line) {
        return line.trim();
      })
    };
  } else {
    output = {
      errorMessage: formatData(err).toString()
    };
  }
  return new Buffer(JSON.stringify(output), encoding);
};

module.exports = {
  formatErr
};