
import * as webpack from 'webpack';
import { BaseConfigFactory } from './base-config-factory';

export class ConfigFactory {
    create(dev: boolean, config: any): webpack.Configuration[] {
        const baseConfig = new BaseConfigFactory().create(dev, config);
        
        return [];
    }
}