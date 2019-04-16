import { injectable, interfaces, inject } from 'inversify';
import { Channel } from '../../common/jsonrpc/channel';
import { Logger } from 'vscode-jsonrpc';
import { ConsoleLogger } from '../../common/logger';
import { JsonRpcProxy, JsonRpcProxyFactory } from '../../common/jsonrpc/proxy-factory';
import { ConnectionHandler } from '../../common/jsonrpc/handler';
import { ConnnectionFactory } from '../../common/jsonrpc/connection-factory';
import { Dispatcher } from '../../common/jsonrpc/dispatcher-protocol';
import { Context } from './service-dispatcher';

export interface ConnectionOptions {
    /**
     * True by default.
     */
    reconnecting?: boolean;
}

@injectable()
export class ProxyProvider {

    static createProxy<T extends object>(container: interfaces.Container, path: string, target?: object): JsonRpcProxy<T> {
        return container.get(ProxyProvider).createProxy<T>(path, target);
    }

    protected channelIdSeq = 0;
    protected readonly channels = new Map<number, Channel>();

    constructor(
        @inject(Dispatcher) protected dispatcher: Dispatcher<Context>,
        @inject(ConnnectionFactory) protected connnectionFactory: ConnnectionFactory<Channel>

    ) {
    }

    createProxy<T extends object>(path: string, target?: object): JsonRpcProxy<T> {
        const factory = new JsonRpcProxyFactory<T>(target);
        this.listen({
            path,
            onConnection: c => factory.listen(c)
        });
        return factory.createProxy();
    }

    listen(handler: ConnectionHandler, options?: ConnectionOptions): void {
        this.openChannel(handler.path, channel => {
            const connection = this.connnectionFactory.create(channel, this.createLogger());
            handler.onConnection(connection);
        }, options);
    }

    openChannel(path: string, handler: (channel: Channel) => void, options?: ConnectionOptions): void {
        this.doOpenChannel(path, handler, options);
    }

    protected doOpenChannel(path: string, handler: (channel: Channel) => void, options?: ConnectionOptions): void {
        const id = this.channelIdSeq++;
        const channel = this.createChannel(id, path);
        this.channels.set(id, channel);
        handler(channel);
    }

    protected createChannel(id: number, path: string): Channel {
        const channel = new Channel(id, content => {
            this.dispatcher.dispatch(new Context(path, content, channel));
        }, path);
        return channel;
    }

    protected createLogger(): Logger {
        return new ConsoleLogger();
    }

}
