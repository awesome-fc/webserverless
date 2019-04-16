import * as program from 'commander';
const config = require('@alicloud/fun/lib/commands/config');

program
    .name('webserverless config')
    .description('Configure the fun.')
    .parse(process.argv);

config();

