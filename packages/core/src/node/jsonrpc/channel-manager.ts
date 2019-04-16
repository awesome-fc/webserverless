import { Context, Callback } from './context';
import { injectable, multiInject, optional, inject } from 'inversify';
import { ConnectionHandler, Channel, ConnnectionFactory, ConsoleLogger } from '../../common';

@injectable()
export class ChannelManager {

    protected channels = new Map<number, Channel>();
    protected callbacks = new Map<number, Callback>();
    protected _handlers = new Map<string, ConnectionHandler>();

    constructor(
        @multiInject(ConnectionHandler) @optional()
        protected readonly handlers: ConnectionHandler[],
        @inject(ConnnectionFactory) protected connnectionFactory: ConnnectionFactory<Channel>
    ) {
        for (const handler of handlers) {
            this._handlers.set(handler.path, handler);
        }
     }

    getChannel(ctx: Context): Promise<Channel> {
        const { id, path } = ctx.message;
        if (path) {
            let channel = this.channels.get(id);
            if (!channel) {
                this.callbacks.set(id, ctx.getCallback());
                channel = this.createChannel(id, (err, data) => this.callbacks.get(id)!(err, data));

                const handler = this._handlers.get(this.getRealPath(path));
                if (handler) {
                    handler.onConnection(this.connnectionFactory.create(channel, new ConsoleLogger()));
                    this.channels.set(id, channel);
                } else {
                    throw new Error('Cannot find a service for the path: ' + path);
                }
            } else {
                this.callbacks.set(id, ctx.getCallback());
            }
            return Promise.resolve(channel);
        } else {
            return Promise.reject(Error('Cannot find a service for the path is empty'));
        }
    }

    protected getRealPath(path: string): string {
        return <string>path.split(':').pop();
    }

    protected createChannel(id: number, callback: Callback) {
        return new Channel(id, content => {
            callback(undefined, content);
        });
    }

}
