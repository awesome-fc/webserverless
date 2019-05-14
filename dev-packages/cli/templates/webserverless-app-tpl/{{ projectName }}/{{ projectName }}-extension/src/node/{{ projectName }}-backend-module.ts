import { ContainerModule } from 'inversify';
import { HelloWorldServerImpl } from './hello-world-server';
import { bindServer } from '@webserverless/core/lib/node/bind-server';
import { helloWorldPath, HelloWorldServer } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {
    bindServer(bind, helloWorldPath, HelloWorldServer, HelloWorldServerImpl);
});
