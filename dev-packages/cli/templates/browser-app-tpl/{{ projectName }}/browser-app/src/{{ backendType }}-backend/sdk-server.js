const express = require('express');
const func = require('./index');
const utils = require('./utils');
var getRawBody = require('raw-body');

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
      } else {
          var output = utils.formatData(data);
          res.statusCode(200);
          res.send(output);
      }
    };
    if (err) {
      callback(err);
    } else {
      getRawBody(req, {limit:'6mb'}, (err, body) => {
        if (err) {
          callback(err);
          return undefined;
        }
        func.handler(body, context, callback);
      });
    }
  });
});

server.listen(8080);

console.log(`Server started at 8080`);