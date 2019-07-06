# {{ projectName }}
The example of how to build the Webserverless-based applications with the {{ projectName }}.

## Getting started

Install [nvm](https://github.com/creationix/nvm#install-script).

    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

Install npm and node.

```bash
nvm install 8
nvm use 8
```

Install yarn.

```bash
npm install -g yarn
```

## Running the {{ projectName }}
```bash
yarn build
yarn start:backend  # start backend
yarn start:frontend # start frontend, or run `yarn start`
```

Open http://localhost:8000 in the browser.

## Developing with {{ projectName }}

```bash
yarn deploy
```

