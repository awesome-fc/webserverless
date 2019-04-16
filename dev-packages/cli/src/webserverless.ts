import * as program from 'commander';
const pkg = require('../package.json');
program
  .version(pkg.version)
  .command('init [name]', 'init webserverless application')
  .command('config', 'configure the fun')
  .command('build', 'build frontend or backend application')
  .command('deploy', 'deply frontend or backend application')
  .parse(process.argv);
