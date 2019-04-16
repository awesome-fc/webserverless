import { ContainerModule } from 'inversify';
import { ConnectionHandler } from '../common/jsonrpc/handler';
import { JsonRpcConnectionHandler } from '../common/jsonrpc/proxy-factory';
import { ConnnectionFactory, ConnnectionFactoryImpl } from '../common/jsonrpc/connection-factory';
import { Dispatcher } from '../common/jsonrpc/dispatcher-protocol';
import { DispatcherImpl, DefaultErrorHandler, ErrorHandlerProvider, ErrorHandler } from './jsonrpc';
import { MiddlewareProvider } from './middleware';
import { ConfigProvider } from '../common/config-provider';
import { ConfigProviderImpl } from './config-provider';
import { ChannelManager } from './jsonrpc/channel-manager';
import { STSServer, stsPath } from '../common/sts';
import { STSServerImpl } from './sts';

export const CoreBackendModule = new ContainerModule(bind => {
    bind(MiddlewareProvider).toSelf().inSingletonScope();
    bind(DefaultErrorHandler).toSelf().inSingletonScope();
    bind(ErrorHandler).toService(DefaultErrorHandler);
    bind(ErrorHandlerProvider).toSelf().inSingletonScope();
    bind(ChannelManager).toSelf().inSingletonScope();
    bind(ConfigProvider).to(ConfigProviderImpl).inSingletonScope();
    bind(Dispatcher).to(DispatcherImpl).inSingletonScope();
    bind(STSServer).to(STSServerImpl).inSingletonScope();
    bind(ConnnectionFactory).to(ConnnectionFactoryImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(stsPath, () => {
            const stsServer = ctx.container.get<STSServer>(STSServerImpl);
            return stsServer;
        })
    ).inSingletonScope();

});
