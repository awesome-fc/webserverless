// @ts-check
require('es6-promise/auto');
require('reflect-metadata');
const { Container } = require('inversify');
const { CoreFrontendModule } = require('@webserverless/core/lib/browser');
const { URL_PREFIX } = require('@webserverless/core/lib/browser/client/http-client');
const { HelloWorldServer } = require('@webserverless/core/lib/common/hello-world/hello-word-protocol');

const container = new Container();
container.load(CoreFrontendModule);

window[URL_PREFIX] = '{{ config.httpClient && config.httpClient.urlPrefix ? config.httpClient.urlPrefix : `https://${profile.accountId}.${profile.defaultRegion}.fc.aliyuncs.com/2016-08-15/proxy` }}';

const helloWorldServer = container.get(HelloWorldServer);

helloWorldServer.say().then(data => console.log(alert(data)));

function load(raw) {
  return Promise.resolve(raw.default).then(module =>
    container.load(module)
  )
}

function start() {

}

module.exports = Promise.resolve()
  .{{ Extension.generateImports(extensions, 'frontend', 'import') }}
    .then(start).catch(reason => {
    console.error('Failed to start the frontend application.');
    if (reason) {
      console.error(reason);
    }
  });
