import * as program from 'commander';
import * as path from 'path';
const init = require('@alicloud/fun/lib/commands/init');

program
    .name('webserverless init')
    .usage('[options] [name]')
    .description('Init webserverless application.')
    .parse(process.argv);

(async () => {
    let appName = 'webserverless-app'
    if (program.args.length > 0) {
        appName = program.args[0];
    }
    const context = {
        location: path.resolve(__dirname, '../templates/webserverless-app-tpl'),
        name: appName,
        outputDir: '.',
        merge: true,
        input: true,
        vars: {}
    };
    await init(context);
})();

