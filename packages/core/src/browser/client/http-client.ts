import { Client } from './client-provider';
import { injectable, inject } from 'inversify';
import { Context } from '../jsonrpc/service-dispatcher';
import { ConfigProvider } from '../../common/config-provider';
import { DEFALUT_SERVICE, defaultServicePath, DEFALUT_FUNCTION, ServicePath } from './fc-client';

export const URL_PREFIX = 'to.httpClient.urlPrefix';

@injectable()
export class HttpClient implements Client {

    constructor(
        @inject(ConfigProvider) protected readonly configProvider: ConfigProvider
    ) {
    }

    async send(ctx: Context): Promise<void> {
        const { path, content, channel } = ctx;
        let url = await this.configProvider.get<string>(URL_PREFIX);
        if (path.startsWith('http:')) {
            url += path;
        } else {
            const servicePath = await this.parse(path);
            url += `/${servicePath.service}/${servicePath.function}/`;
        }
        const response = await fetch(url, {
            method: 'POST',
            body: content
        });
        channel.handleMessage(JSON.parse(await response.text()));
    }

    support(ctx: Context): number {
        return ctx.path.startsWith('http:') || !ctx.path.includes(':') ? 1000 : 0;
    }

    protected async parse(path: string): Promise<ServicePath> {
        const parts = path.split(':');
        if (parts.length > 2) {
            return {
                service: parts[0],
                function: parts[1],
                path: parts[2]
            };
        } else if (parts.length > 1) {
            return {
                ...await this.doGetDefaultServicePath(),
                ...{ function: parts[0], path: parts[1] }
            };
        } else {
            return { ...await this.doGetDefaultServicePath(), ...{ path } };
        }
    }

    protected async doGetDefaultServicePath() {
        return {
            service: await this.configProvider.get<string>(DEFALUT_SERVICE, defaultServicePath.service),
            function: await this.configProvider.get<string>(DEFALUT_FUNCTION, defaultServicePath.function),
        };
    }
}
