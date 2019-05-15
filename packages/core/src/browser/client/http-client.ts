import { Client } from './client-provider';
import { injectable, inject, postConstruct } from 'inversify';
import { Context } from '../jsonrpc/service-dispatcher';
import { ConfigProvider } from '../../common/config-provider';

export const ENDPOINT = 'endpoint';

@injectable()
export class HttpClient implements Client {
    protected endpoint: string;
    constructor(
        @inject(ConfigProvider) protected readonly configProvider: ConfigProvider
    ) {
    }

    @postConstruct()
    async init(): Promise<void> {
        this.endpoint = await this.configProvider.get(ENDPOINT);
    }

    async send(ctx: Context): Promise<void> {
        const { content, channel } = ctx;
        const response = await fetch(this.endpoint, {
            method: 'POST',
            body: content
        });
        channel.handleMessage(JSON.parse(await response.text()));
    }

    support(ctx: Context): number {
        return !ctx.path.includes(':') ? 1000 : 0;
    }
}
