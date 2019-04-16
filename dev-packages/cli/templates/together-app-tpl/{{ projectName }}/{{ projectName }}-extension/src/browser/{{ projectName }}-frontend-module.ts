import { ContainerModule } from 'inversify';
import { ProxyProvider } from '@webserverless/core/lib/browser/jsonrpc/proxy-provider';
import { HelloWorldServer, helloWorldPath } from '../common/hello-word-protocol';

export const CoreFrontendModule = new ContainerModule(bind => {

    bind(HelloWorldServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        const helloWorldServer =  provider.createProxy<HelloWorldServer>(helloWorldPath);
        helloWorldServer.say().then(r => alert(r));
        return helloWorldServer;
    }).inSingletonScope();

});
