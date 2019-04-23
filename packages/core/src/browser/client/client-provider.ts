import { injectable, multiInject } from 'inversify';
import { Context } from '../jsonrpc/service-dispatcher';
import { Prioritizeable } from '../../common/prioritizeable';

export const Client = Symbol('Client');

export interface Client {
    send(ctx: Context): Promise<void>;
    support(ctx: Context): number
}

@injectable()
export class ClientProvider {

    constructor(
        @multiInject(Client)
        protected readonly clients: Client[]
    ) { }

    provide(ctx: Context): Client {
        return this.prioritize(ctx)[0];
    }

    protected prioritize(ctx: Context): Client[] {
        const prioritized = Prioritizeable.prioritizeAllSync(this.clients, client => {
            try {
                return client.support(ctx);
            } catch {
                return 0;
            }
        });
        return prioritized.map(p => p.value);
    }

}
