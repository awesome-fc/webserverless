# {{ projectName }}-extension
The example of how to build the Webserverless-based applications with the {{ proejectName }}-extension.

## Getting started

Install [nvm](https://github.com/creationix/nvm#install-script).

    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

Install npm and node.

    nvm install 8
    nvm use 8

Install yarn.

    npm install -g yarn

## Running the browser example

    yarn build
    cd browser-app
    yarn build
    yarn deploy
    yarn start

Open http://localhost:8000 in the browser.

## Developing with the example

Start watching of {{ projectName }}-extension.

    cd {{ projectName }}-extension
    yarn watch

## Publishing {{ projectName }}-extension

Create a npm user and login to the npm registry, [more on npm publishing](https://docs.npmjs.com/getting-started/publishing-npm-packages).

    npm login

Publish packages with lerna to update versions properly across local packages, [more on publishing with lerna](https://github.com/lerna/lerna#publish).

    npx lerna publish
