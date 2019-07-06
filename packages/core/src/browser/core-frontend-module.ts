import { ContainerModule } from 'inversify';
import { ProxyProvider } from './jsonrpc/proxy-provider';
import { ConnnectionFactory, ConnnectionFactoryImpl } from '../common/jsonrpc/connection-factory';
import { Dispatcher } from '../common/jsonrpc/dispatcher-protocol';
import { ServiceDispatcher } from './jsonrpc/service-dispatcher';
import { ClientProvider, Client } from './client';
import { HttpClient } from './client/http-client';
import { FCClient } from './client/fc-client';
import { ConfigProvider } from '../common/config-provider';
import { ConfigProviderImpl } from './config-provider';
import { RPC } from '../common/annotation/rpc-inject';

export const CoreFrontendModule = new ContainerModule(bind => {
    bind(ClientProvider).toSelf().inSingletonScope();
    bind(FCClient).toSelf().inSingletonScope();
    bind(Client).to(HttpClient).inSingletonScope();
    bind(Client).toService(FCClient);
    bind(Dispatcher).to(ServiceDispatcher).inSingletonScope();
    bind(ConnnectionFactory).to(ConnnectionFactoryImpl).inSingletonScope();
    bind(ProxyProvider).toSelf().inSingletonScope();
    bind(ConfigProvider).to(ConfigProviderImpl).inSingletonScope();

    bind(RPC).toDynamicValue(ctx => {
        const namedMetadata = ctx.currentRequest.target.getNamedTag();
        const path = namedMetadata!.value.toString();
        return ProxyProvider.createProxy(ctx.container, path);
    });

});
