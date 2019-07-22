import { ContainerModule } from 'inversify';
import { ProxyProvider, ProxyCreator } from './jsonrpc/proxy-protocol';
import { ConnnectionFactory, ConnnectionFactoryImpl } from '../common/jsonrpc/connection-factory';
import { ConfigProvider } from '../common/config-provider';
import { ConfigProviderImpl } from './config-provider';
import { RPC } from '../common/annotation/rpc-inject';
import { ProxyProviderImpl, HttpProxyCreator, WebSocketProxyCreator } from './jsonrpc';

export const CoreFrontendModule = new ContainerModule(bind => {
    bind(ProxyProvider).to(ProxyProviderImpl).inSingletonScope();
    bind(HttpProxyCreator).toSelf().inSingletonScope();
    bind(ProxyCreator).toService(HttpProxyCreator);
    bind(WebSocketProxyCreator).toSelf().inSingletonScope();
    bind(ProxyCreator).toService(WebSocketProxyCreator);
    bind(ConnnectionFactory).to(ConnnectionFactoryImpl).inSingletonScope();
    bind(ConfigProvider).to(ConfigProviderImpl).inSingletonScope();

    bind(RPC).toDynamicValue(ctx => {
        const namedMetadata = ctx.currentRequest.target.getNamedTag();
        const path = namedMetadata!.value.toString();
        const proxyProvider = ctx.container.get<ProxyProvider>(ProxyProvider);
        return proxyProvider.provide(path);
    });

});
