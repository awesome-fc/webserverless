import { interfaces } from 'inversify';
import { ProxyProvider } from './jsonrpc/proxy-provider';

export function bindServer<T extends object>(bind: interfaces.Bind, path: string, identifier: interfaces.ServiceIdentifier<T>, target?: object) {
    bind(identifier).toDynamicValue(ctx =>  ProxyProvider.createProxy(ctx.container, path, target)).inSingletonScope();
}
