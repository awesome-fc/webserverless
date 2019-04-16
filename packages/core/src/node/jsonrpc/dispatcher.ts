import { Dispatcher } from '../../common/jsonrpc/dispatcher-protocol';
import { Context, Callback } from './context';
import { inject, injectable } from 'inversify';
import { Channel, ConnnectionFactory } from '../../common/jsonrpc';
import { MiddlewareProvider, Middleware } from '../middleware';
import * as getRowBody from 'raw-body';
import { ErrorHandlerProvider } from './error-hander-provider';
import { ChannelManager } from './channel-manager';

export class ApiGatewayContext extends Context {
    readonly request: any;

    constructor(protected event: string, protected context: any, protected callback: Callback) {
        super(context);
        this.request = JSON.parse(event);
    }

    getEvent(): Promise<string> {
        if (this.request.isBase64Encoded) {
            return Promise.resolve(new Buffer(this.request.body).toString('base64'));
        }
        return Promise.resolve(this.request.body);
    }
    getCallback(): Callback {
        return (err: Error, data: any) => {
            if (err) {
                this.callback(err, undefined);
            } else {
                this.callback(undefined, {
                    isBase64Encoded: false,
                    statusCode: 200,
                    body: data
                });
            }
        };
    }
}

export class HttpContext extends Context {
    readonly request: any;
    readonly response: any;

    constructor(request: any, response: any, context: Context) {
        super(context);
        this.request = request;
        this.response = response;
    }

    getEvent(): Promise<string> {
        return new Promise((resolve, reject) => {
            getRowBody(this.request, (err, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body.toString());
                }
            });
        });
    }
    getCallback(): Callback {
        return (err: Error, data: any) => {
            if (err) {
                this.response.statusCode = 500;
                this.response.send(err.message);
            } else {
                this.response.send(data);
            }
        };
    }
}
export class EventContext extends Context {
    readonly event: string;
    readonly callback: (err: Error, data: any) => void;

    constructor(event: string, context: any, callback: Callback) {
        super(context);
        this.event = event;
        this.callback = callback;
    }

    getEvent(): Promise<string> {
        return Promise.resolve(this.event);
    }

    getCallback(): Callback {
        return this.callback;
    }
}

@injectable()
export class DispatcherImpl implements Dispatcher<Context> {

    constructor(
        @inject(ChannelManager) protected readonly channelManager: ChannelManager,
        @inject(MiddlewareProvider) protected middlewareProvider: MiddlewareProvider,
        @inject(ErrorHandlerProvider) protected errorHandlerProvider: ErrorHandlerProvider,
        @inject(ConnnectionFactory) protected connnectionFactory: ConnnectionFactory<Channel>

    ) {
     }

    async dispatch(ctx: Context): Promise<void> {
        try {
            ctx.message = JSON.parse(await ctx.getEvent());
            Context.setCurrent(ctx);
            const middleware = this.compose();
            await middleware(ctx, {
                handle: async (c: Context, next: () => Promise<void>) => {
                    try {
                        await this.handleMessage(c);
                        return Promise.resolve();
                    } catch (err) {
                        return Promise.reject(err);
                    }
                },
                priority: 0
            });
        } catch (err) {
            await this.handleError(ctx, err);
        }
    }

    protected async handleError(ctx: Context, err: Error): Promise<void> {
        const errorHandlers = this.errorHandlerProvider.provide();
        for (const handler of errorHandlers) {
            if (await handler.canHandle(ctx, err)) {
                try {
                    await handler.handle(ctx, err);
                } catch (error) {
                    continue;
                }
                return;
            }
        }
    }

    protected async handleMessage(ctx: Context): Promise<void> {
        const channel = await this.channelManager.getChannel(ctx);
        channel.handleMessage(ctx.message);
    }

    protected compose() {
        return (ctx: Context, next: Middleware) => {
            let index = -1;
            const middlewares = this.middlewareProvider.provide();
            const dispatch = (i: number): Promise<void> => {
                if (i <= index) {
                    return Promise.reject(new Error('next() called multiple times'));
                }
                index = i;
                let middleware = middlewares[i];
                if (i === middlewares.length) {
                    middleware = next;
                }
                if (!middleware) {
                    return Promise.resolve();
                }
                try {
                    return Promise.resolve(middleware.handle(ctx, (): Promise<void> => dispatch(i + 1)));
                } catch (err) {
                    return Promise.reject(err);
                }
            };
            return dispatch(0);
        };
    }
}
