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

// Translate data into a byte buffer.
const formatData = function (data) {
  // data is null or undefined.
  if (data == null) {
    return null;
  }

  // Buffer
  if (data instanceof Buffer) {
    return data
  }

  // Convert other data type to buffer.
  var output = data.toString();
  switch (typeof (data)) {
    case 'function':
      output = data.constructor.toString();
      break;
    case 'object':
      output = JSON.stringify(data);
      break;
    case 'string':
      output = data;
      break;
    case 'number':
    case 'boolean':
      output = data.toString();
      break;
  }
  return new Buffer(output, encoding);
};

module.exports = {
  formatData, formatErr
};