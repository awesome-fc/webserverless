import { HelloWorldServer } from '../../common/hello-world/hello-word-protocol';
import { injectable } from 'inversify';

@injectable()
export class HelloWorldServerImpl implements HelloWorldServer {
    say(): Promise<string> {
        return Promise.resolve('Hello world.');
    }
}
