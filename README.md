# WebServerless

Serverless based web development framework.

## Getting Started

```bash
npm install @webserverless/cli@next -g
npm install -g yarn
webserverless init demo
cd demo
yarn
yarn build
cd browser-app
yarn
yarn build
yarn deploy
yarn start
```

## Defining interface

```typescript
// src/common/hello-world-protocol.ts
export const helloWorldPath = '/services/helloworld';

export const HelloWorldServer = Symbol('HelloWorldServer');

export interface HelloWorldServer {
    say(): Promise<string>;
}

```
## Defining server

```typescript
// src/node/hello-world-server.ts
import { injectable } from 'inversify';
import { HelloWorldServer } from '../common/hello-world-protocol';

@injectable()
export class HelloWorldServerImpl implements HelloWorldServer {
    say(): Promise<string> {
        return Promise.resolve('Hello world.');
    }
}
```

## Binding server

```typescript
// src/node/demo-backend-module.ts
import { ContainerModule } from 'inversify';
import { HelloWorldServerImpl } from './hello-world-server';
import { bindServer } from '@webserverless/core/lib/node/bind-server';
import { helloWorldPath, HelloWorldServer } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {
    bindServer(bind, helloWorldPath, HelloWorldServer, HelloWorldServerImpl);
});
```

## Binding client proxy

```typescript
// src/browser/demo-frontend-module.ts
import { ContainerModule } from 'inversify';
import { bindServer } from '@webserverless/core/lib/browser/bind-server';
import { HelloWorldServer, helloWorldPath } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {
    bindServer(bind, helloWorldPath, HelloWorldServer);
});
```

## Using client proxy

```typescript
// src/browser/hello-world-service.ts
import { injectable, inject } from "inversify";
import { HelloWorldServer } from "../common/hello-world-protocol";

@injectable()
export class HelloWorldService {

    constructor(
        @inject(HelloWorldServer) protected readonly helloWorldServer: HelloWorldServer
    ) {}
    
}
```


