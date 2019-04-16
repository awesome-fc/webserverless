// @ts-check
require('reflect-metadata');
const { Container } = require('inversify');
const { CoreBackendModule, HttpContext } = require('@webserverless/core/lib/node');
const { Dispatcher } = require('@webserverless/core/lib/common/jsonrpc/dispatcher-protocol');

const container = new Container();
container.load(CoreBackendModule);

function load(raw) {
  return Promise.resolve(raw.default).then(module =>
    container.load(module)
  )
}

const loadPromise = Promise.resolve()
  .{{ Extension.generateImports(extensions, 'backend', 'require') }};

module.exports.init = async (context, callback) => {
  try {
    await loadPromise;
    callback(null, '')
  } catch (err) {
    callback(err)
  }
};


module.exports.handler = function (request, response, context) {
  const dispatcher = container.get(Dispatcher);
  dispatcher.dispatch(new HttpContext(request, response, context))
};
// (JSON.stringify({
//     "id": 2,
//     "kind": "data",
//     "path": "/services/helloworld",
//     "content": JSON.stringify({
//         "id": 1,
//         "method": "say"
//     })
// }), {}, (err, data) => console.log(data));

