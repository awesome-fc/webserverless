import { ContainerModule } from 'inversify';
import { ProxyProvider } from '@webserverless/core/lib/browser/jsonrpc/proxy-provider';
import { HelloWorldServer, helloWorldPath } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {

    bind(HelloWorldServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        const helloWorldServer =  provider.createProxy<HelloWorldServer>(helloWorldPath);
        return helloWorldServer;
    }).inSingletonScope();

});
