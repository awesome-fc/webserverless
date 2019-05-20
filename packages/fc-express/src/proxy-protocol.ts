export const EVENT_HEADER_NAME = 'x-fc-express-event';
export const CONTEXT_HEADER_NAME = 'x-fc-express-context';

export type Callback = (err?: Error, data?: any) => void;

export type Resolver = (data?: any) => void;

export interface Context {
    context: any;
}

export interface ApiGatewayContext extends Context {
    event: any;
    callback: Callback;
}

export interface HttpTriggerContext extends Context {
    request: any;
    response: any;
}

export interface Proxy<T extends Context> {
    handle(ctx: T): void;
}
