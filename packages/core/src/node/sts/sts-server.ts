import { Config } from '@webserverless/fc-browser-sdk/lib/browser';
import * as Client from '@alicloud/pop-core';
import { ConfigProvider } from '../../common/config-provider';
import { inject } from 'inversify';
import { Context } from '../jsonrpc/context';
import { STSServer } from '../../common/sts';

export class STSServerImpl implements STSServer {

    @inject(ConfigProvider)
    protected readonly configProvider: ConfigProvider;
    async getConfig(roleArn?: string, roleSessionName?: string): Promise<Config> {
        const ctx = Context.getCurrent<Context>().innerContext();
        const accountId = ctx.accountId;
        if (roleArn) {
            const client = new Client({
                accessKeyId: await this.configProvider.get<string>('accessKeyId'),
                accessKeySecret: await this.configProvider.get<string>('accessKeySecret'),
                endpoint: 'https://sts.aliyuncs.com',
                apiVersion: '2015-04-01'
            });
            const result: any = await client.request('AssumeRole', { RoleArn: roleArn, RoleSessionName: roleSessionName });
            return { ...result.Credentials, accountId };
        } else {
            return { ...ctx.credentials, accountId };
        }
    }
}
