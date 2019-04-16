import { ContainerModule } from 'inversify';
import { UserServer, userPath, AuthServer, authPath } from '../common';
import { ProxyProvider } from '@webserverless/core/lib/browser';

export default new ContainerModule(bind => {

    bind(UserServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        return provider.createProxy<UserServer>(userPath);
    }).inSingletonScope();

    bind(AuthServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        return provider.createProxy<AuthServer>(authPath);
    }).inSingletonScope();

});
