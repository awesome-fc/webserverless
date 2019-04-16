import { ConfigProvider } from '../common/config-provider';
import { injectable } from 'inversify';

@injectable()
export class ConfigProviderImpl implements ConfigProvider {
    get<T>(key: string, defaultValue?: T): Promise<T> {
        const value = process.env[key] as any;
        return Promise.resolve(value || defaultValue);
    }

}
