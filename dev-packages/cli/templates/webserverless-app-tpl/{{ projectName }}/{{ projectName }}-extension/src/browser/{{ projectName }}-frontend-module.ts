import { ContainerModule } from 'inversify';
import { bindServer } from '@webserverless/core/lib/browser/bind-server';
import { HelloWorldServer, helloWorldPath } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {
    bindServer(bind, helloWorldPath, HelloWorldServer);
});
