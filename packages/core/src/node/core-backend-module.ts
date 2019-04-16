import { ContainerModule } from 'inversify';
import { HelloWorldServerImpl } from './hello-world/hello-world-server';
import { ConnectionHandler } from '../common/jsonrpc/handler';
import { JsonRpcConnectionHandler } from '../common/jsonrpc/proxy-factory';
import { helloWorldPath, HelloWorldServer } from '../common/hello-world/hello-word-protocol';
import { ConnnectionFactory, ConnnectionFactoryImpl } from '../common/jsonrpc/connection-factory';
import { Dispatcher } from '../common/jsonrpc/dispatcher-protocol';
import { DispatcherImpl, DefaultErrorHandler, ErrorHandlerProvider, ErrorHandler } from './jsonrpc';
import { MiddlewareProvider } from './middleware';
import { ConfigProvider } from '../common/config-provider';
import { ConfigProviderImpl } from './config-provider';
import { ChannelManager } from './jsonrpc/channel-manager';

export const CoreBackendModule = new ContainerModule(bind => {
    bind(MiddlewareProvider).toSelf().inSingletonScope();
    bind(DefaultErrorHandler).toSelf().inSingletonScope();
    bind(ErrorHandler).toService(DefaultErrorHandler);
    bind(ErrorHandlerProvider).toSelf().inSingletonScope();
    bind(ChannelManager).toSelf().inSingletonScope();
    bind(ConfigProvider).to(ConfigProviderImpl).inSingletonScope();
    bind(Dispatcher).to(DispatcherImpl).inSingletonScope();
    bind(HelloWorldServer).to(HelloWorldServerImpl).inSingletonScope();
    bind(ConnnectionFactory).to(ConnnectionFactoryImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(helloWorldPath, () => {
            const helloWorldServer = ctx.container.get<HelloWorldServer>(HelloWorldServer);
            return helloWorldServer;
        })
    ).inSingletonScope();

});
