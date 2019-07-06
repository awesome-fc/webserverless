import { HelloWorldServer } from '../common/hello-world-protocol';
import { rpcInject, component } from '@webserverless/core/lib/common/annotation';

@component(HelloWorldService)
export class HelloWorldService {

    constructor(
        @rpcInject(HelloWorldServer) helloWorldServer: HelloWorldServer
    ){
        helloWorldServer.say().then(r => alert(r));
    }

    
}
