import { ContainerModule } from 'inversify';
import { ProxyProvider } from './jsonrpc/proxy-provider';
import { HelloWorldServer, helloWorldPath } from '../common/hello-world/hello-word-protocol';
import { ConnnectionFactory, ConnnectionFactoryImpl } from '../common/jsonrpc/connection-factory';
import { Dispatcher } from '../common/jsonrpc/dispatcher-protocol';
import { ServiceDispatcher } from './jsonrpc/service-dispatcher';
import { ClientProvider, Client } from './client';
import { HttpClient } from './client/http-client';
import { FCClient } from './client/fc-client';
import { STSServer, stsPath } from '../common/sts/sts-protocol';
import { ConfigProvider } from '../common/config-provider';
import { ConfigProviderImpl } from './config-provider';

export const CoreFrontendModule = new ContainerModule(bind => {
    bind(ClientProvider).toSelf().inSingletonScope();
    bind(FCClient).toSelf().inSingletonScope();
    bind(Client).to(HttpClient).inSingletonScope();
    bind(Client).toService(FCClient);
    bind(Dispatcher).to(ServiceDispatcher).inSingletonScope();
    bind(ConnnectionFactory).to(ConnnectionFactoryImpl).inSingletonScope();
    bind(ProxyProvider).toSelf().inSingletonScope();
    bind(ConfigProvider).to(ConfigProviderImpl).inSingletonScope();

    bind(HelloWorldServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        return provider.createProxy<HelloWorldServer>(helloWorldPath);
    }).inSingletonScope();

    bind(STSServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        const stsServer = provider.createProxy<STSServer>(stsPath);
        ctx.container.get(FCClient).stsServer = stsServer;
        return stsServer;
    }).inSingletonScope();

});
