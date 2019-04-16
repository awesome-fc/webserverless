import * as program from 'commander';
const depoy = require('@alicloud/fun/lib/commands/deploy');

program
    .name('webserverless deploy')
    .description('Deploy frontend or backend application.')
    .parse(process.argv);

depoy(null, './dist/template.yml');

