import { Disposable, DisposableCollection } from '../disposable';
import { Emitter } from 'vscode-jsonrpc';

export interface Message {
    kind: 'data'
    id: number
    path?: string
    content: string
    token?: string
}

export class Channel {

    protected readonly closeEmitter = new Emitter<[number, string]>();
    protected readonly toDispose = new DisposableCollection(this.closeEmitter);

    constructor(
        readonly id: number,
        protected readonly doSend: (content: string) => void,
        protected readonly path?: string
    ) { }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected checkNotDisposed(): void {
        if (this.toDispose.disposed) {
            throw new Error('The channel has been disposed.');
        }
    }

    handleMessage(message: Message) {
        this.fireMessage(message.content);
    }

    send(content: string): void {
        this.checkNotDisposed();
        this.doSend(JSON.stringify(<Message>{
            kind: 'data',
            id: this.id,
            path: this.path,
            content
        }));
    }

    protected fireMessage: (data: any) => void = () => { };
    onMessage(cb: (data: any) => void): void {
        this.checkNotDisposed();
        this.fireMessage = cb;
        this.toDispose.push(Disposable.create(() => this.fireMessage = () => { }));
    }

}
