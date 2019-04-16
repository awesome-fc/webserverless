import { Client } from './client-provider';
import { Client as InnerClient } from '@webserverless/fc-browser-sdk/lib/browser';
import { injectable, inject } from 'inversify';
import { Context } from '../jsonrpc/service-dispatcher';
import { STSServer } from '../../common/sts/sts-protocol';
import { ConfigProvider } from '../../common/config-provider';

export interface ServicePath {
    service: string
    function: string
    path: string
}

export const defaultServicePath = {
    service: 'webserverless-service',
    function: 'webserverless'
};

export const DEFALUT_SERVICE = 'to.fcClient.defalutService';
export const DEFALUT_FUNCTION = 'to.fcClient.defalutFunction';

@injectable()
export class FCClient implements Client {

    protected client: InnerClient;
    stsServer: STSServer;

    constructor(
        @inject(ConfigProvider) protected readonly configProvider: ConfigProvider
    ) {
    }

    async send(ctx: Context): Promise<void> {
        const { path, content, channel } = ctx;
        const client = await this.getOrCreateClient();
        const servicePath = await this.parse(path);
        const result = await client.invokeFunction(servicePath.service, servicePath.function, content);
        channel.handleMessage(JSON.parse(result.data));
    }

    support(ctx: Context): number {
        return ctx.path.startsWith('fc:') ? 500 : 0;
    }

    protected async createClient() {
        const config = await this.stsServer.getConfig();
        this.client = new InnerClient(config);
        return this.client;
    }

    protected getOrCreateClient() {
        if (this.client) {
            return Promise.resolve(this.client);
        }
        setInterval(() => {
            this.createClient();
        }, 180000);
        return this.createClient();
    }

    protected async parse(path: string): Promise<ServicePath> {
        const parts = path.split(':');
        parts.pop();
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
