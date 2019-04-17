# WebServerless

Severless based web development framework.

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
import { ConnectionHandler } from '@webserverless/core/lib/common/jsonrpc/handler';
import { JsonRpcConnectionHandler } from '@webserverless/core/lib/common/jsonrpc/proxy-factory';
import { helloWorldPath, HelloWorldServer } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {
    bind(HelloWorldServer).to(HelloWorldServerImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(helloWorldPath, () => {
            const helloWorldServer = ctx.container.get<HelloWorldServer>(HelloWorldServer);
            return helloWorldServer;
        })
    ).inSingletonScope();

});
```

## Binding client proxy

```typescript
// src/browser/demo-frontend-module.ts
import { ContainerModule } from 'inversify';
import { ProxyProvider } from '@webserverless/core/lib/browser/jsonrpc/proxy-provider';
import { HelloWorldServer, helloWorldPath } from '../common/hello-world-protocol';

export default new ContainerModule(bind => {

    bind(HelloWorldServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(ProxyProvider);
        const helloWorldServer =  provider.createProxy<HelloWorldServer>(helloWorldPath);
        return helloWorldServer;
    }).inSingletonScope();

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


