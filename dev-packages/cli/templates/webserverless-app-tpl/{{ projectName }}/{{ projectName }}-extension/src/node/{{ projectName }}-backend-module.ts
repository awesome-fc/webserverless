import { ContainerModule } from 'inversify';
import { HelloWorldServerImpl } from './hello-world-server';
import { ConnectionHandler } from '@webserverless/core/lib/common/jsonrpc/handler';
import { JsonRpcConnectionHandler } from '@webserverless/core/lib/common/jsonrpc/proxy-factory';
import { helloWorldPath, HelloWorldServer } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {
    bind(HelloWorldServer).to(HelloWorldServerImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(helloWorldPath, () => {
            const helloWorldServer = ctx.container.get<HelloWorldServer>(HelloWorldServer);
            return helloWorldServer;
        })
    ).inSingletonScope();

});
