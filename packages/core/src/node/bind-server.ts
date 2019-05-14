import { interfaces } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '../common/jsonrpc';

export function bindServer<T extends object>(bind: interfaces.Bind, path: string, identifier: interfaces.ServiceIdentifier<T>, constructor: {
    new (...args: any[]): T;
}, target?: object) {
    bind(identifier).to(constructor).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(path, proxy => {
            if (target) {
                (proxy as any).setClient(target);
            }
            return ctx.container.get<T>(identifier);
        })
    ).inSingletonScope();
}
