export const Dispatcher = Symbol('Dispatcher');

export interface Dispatcher<T> {
    dispatch(ctx: T): Promise<void>;
}
