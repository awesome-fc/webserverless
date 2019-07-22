
import * as webpack from 'webpack';

export class BaseConfigFactory {
    create(dev: boolean, config: any): webpack.Configuration {
        const webpackMode = dev ? 'development' : 'production'
        return {
            mode: webpackMode,
            devtool: dev ? 'source-map' : undefined,
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        enforce: 'pre',
                        loader: 'source-map-loader',
                        exclude: /jsonc-parser|node_modules/
                    }
                ]
            },
            plugins: [
                new webpack.DefinePlugin({
                    'process.env': JSON.stringify(config)
                })
            ]
        };
    }
}