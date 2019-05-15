
import * as program from 'commander';
import { ExtensionManager, Extension } from './extension-manager';
import * as path from 'path';
import * as fs from 'fs';
const init = require('@alicloud/fun/lib/commands/init');
const { getProfile } = require('@alicloud/fun/lib/profile');

program
    .name('webserverless build')
    .usage('[options]')
    .description('Build frontend or backend application.')
    .parse(process.argv);

(async () => {
    const extensionManager = new ExtensionManager();
    const extensions = await extensionManager.collectExtension();

    const profile = await getProfile();
    const configPath = path.resolve(process.cwd(), 'webserverless.config.json');
    const config = fs.existsSync(configPath) ? require(configPath) : { backendType: 'http', frontendType: 'local'};
    const appName = 'browser-app';
    
    const context = {
        location: path.resolve(__dirname, '../templates/browser-app-tpl'),
        outputDir: '.',
        merge: true,
        input: true,
        vars: { extensions,  profile, config, Extension, appPath: path.resolve(process.cwd(), appName), appName }
    };
    await init(context);
})();

