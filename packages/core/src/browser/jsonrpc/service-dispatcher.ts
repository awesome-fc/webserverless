import { injectable, inject } from 'inversify';
import { Channel } from '../../common/jsonrpc/channel';
import { Dispatcher } from '../../common/jsonrpc/dispatcher-protocol';
import { ClientProvider } from '../client';

export class Context {
    constructor(readonly path: string, readonly content: string, readonly channel: Channel) {

    }
}

@injectable()
export class ServiceDispatcher implements Dispatcher<Context> {

    constructor(
        @inject(ClientProvider) protected clientProvider: ClientProvider,
    ) {
    }

    async dispatch(ctx: Context): Promise<void> {
        const client = await this.clientProvider.provide(ctx);
        await client.send(ctx);
    }
}
