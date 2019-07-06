import * as program from 'commander';
import * as path from 'path';
import * as fs from 'fs';
const depoy = require('@alicloud/fun/lib/commands/deploy');

program
    .name('webserverless deploy')
    .description('Deploy frontend or backend application.')
    .parse(process.argv);

const configPath = path.resolve(process.cwd(), '../webserverless.config.json');
const config = fs.existsSync(configPath) ? require(configPath) : { backendType: 'http', frontendType: 'local'};
depoy(null, path.resolve(process.cwd(), `src/backend/template-${config.backendType}.yml`));

