
import * as program from 'commander';
import * as webpack from 'webpack';

import { ExtensionManager } from '../extension-manager';
import * as path from 'path';
import * as fs from 'fs';
import { CONFIG_FILE } from '../constants';
import { ConfigFactory } from '../webpack/config/config-factory';

program
    .name('webserverless build')
    .usage('[options]')
    .description('Build frontend or backend application.')
    .parse(process.argv);

(async () => {
    const extensionManager = new ExtensionManager();
    const extensions = await extensionManager.collectExtension();
    const configPath = path.resolve(process.cwd(), CONFIG_FILE);
    const config = fs.existsSync(configPath) ? require(configPath) : {};

    webpack(new ConfigFactory().create(false, config), (err, stats) => {
        if (err) {
            console.error(err.stack || err);
            if ((err as any).details) {
                console.error((err as any).details);
            }
            return;
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
            console.error(info.errors);
        }

        if (stats.hasWarnings()) {
            console.warn(info.warnings);
        }
    });
})();

