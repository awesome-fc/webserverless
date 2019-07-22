import * as requestContext from 'express-http-context';
import { Channel } from '../../common/jsonrpc/channel-protocol';

export enum AttributeScope { App, Request }

export const CURRENT_CONTEXT_REQUEST_KEY = 'CurrentContextRequest';

const appAttrs = new Map<string, any>();

export interface Context {

    getMessage(): Promise<Channel.Message>;

    handleError(err: Error): Promise<void>;

    handleMessage(message: string): Promise<void>;

    createChannel(id: number): Promise<Channel>

    handleChannels(channelFactory: () => Promise<Channel>): Promise<void>;

}

export namespace Context {

    export function run(fn: (...args: any[]) => void) {
        requestContext.ns.run(fn);
    }

    export function setCurrent(context: Context) {
        requestContext.set(CURRENT_CONTEXT_REQUEST_KEY, context);
    }

    export function getCurrent<T extends Context>(): T {
        return requestContext.get(CURRENT_CONTEXT_REQUEST_KEY);
    }

    export function setAttr(key: string, value: any, scope: AttributeScope = AttributeScope.Request) {
        if (scope === AttributeScope.Request) {
            requestContext.set(key, value);
        } else {
            appAttrs.set(key, value);
        }
    }

    export function getAttr<T>(key: string, scope?: AttributeScope): T {
        if (scope) {
            if (scope === AttributeScope.Request) {
                return requestContext.get(key);
            } else {
                return appAttrs.get(key);
            }
        } else {
            const value = requestContext.get(key);
            return value ? value : appAttrs.get(key);
        }
    }

}
