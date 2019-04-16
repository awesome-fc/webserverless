import { Message } from '../../common/jsonrpc';

export type Callback = (err: Error | undefined, data: any) => void;

export abstract class Context {

    readonly innerContext: any;

    message: Message;

    readonly attrs = new Map<string, any>();

    private static _current: Context;

    constructor(innerContext: any) {
        this.innerContext = innerContext;
    }

    static setCurrent(current: Context) {
        this._current = current;
    }

    static getCurrent<T>(): T {
        return this._current as any;
    }

    static setAttr(key: string, value: any) {
        this._current.attrs.set(key, value);
    }

    static getAttr<T>(key: string): T {
        return this._current.attrs.get(key);
    }

    abstract getEvent(): Promise<string>;

    abstract getCallback(): Callback;
}
