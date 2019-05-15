// @ts-check
require('es6-promise/auto');
require('reflect-metadata');
const { Container } = require('inversify');
const { CoreFrontendModule } = require('@webserverless/core/lib/browser');
const { CONFIG } = require('@webserverless/core/lib/common/config-provider');
const configPath = '../../../webserverless.config.json'
const config = require(configPath);
const { STSServer } = require('@webserverless/core/lib/common/sts/sts-protocol');

const container = new Container();
container.load(CoreFrontendModule);
config.endpoint = window['endpoint'];
window[CONFIG] = config;
// const helloWorldServer = container.get(HelloWorldServer);

// helloWorldServer.say().then(data => console.log(alert(data)));

function load(raw) {
  return Promise.resolve(raw.default).then(module =>
    container.load(module)
  )
}

function start() {
  const stsServer = container.get(STSServer);
  stsServer.getConfig().then(data => console.log(data));
}

module.exports = Promise.resolve()
  .{{ Extension.generateImports(extensions, 'frontend', 'import') }}
    .then(start).catch(reason => {
    console.error('Failed to start the frontend application.');
    if (reason) {
      console.error(reason);
    }
  });
