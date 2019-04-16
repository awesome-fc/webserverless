
import * as program from 'commander';
import { ExtensionManager, Extension } from './extension-manager';
import * as path from 'path';
import * as fs from 'fs';
const rimraf = require('rimraf');
const init = require('@alicloud/fun/lib/commands/init');
const { getProfile } = require('@alicloud/fun/lib/profile');

program
    .name('webserverless build')
    .usage('[options]')
    .description('Build frontend or backend application.')
    .option('-f, --frontend [frontend]', 'build frontend application')
    .option('-b, --backend [backend]', 'build backend application')
    .option('-t, --backendType [backendType]', 'build backend application type', /^(http|sdk|api-getway-backend)$/i, 'http')
    .parse(process.argv);

(async () => {
    const frontend = program.frontend || !program.backend;
    const backend = program.backend || !program.frontend;

    const extensionManager = new ExtensionManager();
    const extensions = await extensionManager.collectExtension();

    const profile = await getProfile();
    const configPath = path.resolve(process.cwd(), 'webserverless.config.json');
    const config = fs.existsSync(configPath) ? require(configPath) : {};
    const appName = 'browser-app';
    
    const context = {
        location: path.resolve(__dirname, '../templates/browser-app-tpl'),
        name: appName,
        outputDir: '.',
        merge: true,
        input: true,
        vars: { extensions, backendType: program.backendType, profile, config, Extension, appPath: path.resolve(process.cwd(), appName) }
    };
    await init(context);
    if (!frontend) {
        rimraf(path.resolve(`./${appName}/src/frontend`));
        rimraf(path.resolve(`./${appName}/webpack.frontend.config`));
    }
    if (!backend) {
        rimraf(path.resolve(`./browser-app/src/${program.backendType}-backend`));
        rimraf(path.resolve(`./${appName}/webpack.backend.config`));
    }
})();

