const express = require('express');
const func = require('./http-index');

const server = express();

server.post(/.*/, async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  const context = {};
  await func.init(context, err => {
    const callback = (err, data) => {
      if (err) {
          var output = utils.formatErr(err);
          console.err(output);
          res.statusCode(417);
          res.send(output);
      }
    };
    if (err) {
      callback(err);
    } else {
      func.handler(req, res, context);
    }
  });
});

server.listen(8080);

console.log(`Server started at 8080`);