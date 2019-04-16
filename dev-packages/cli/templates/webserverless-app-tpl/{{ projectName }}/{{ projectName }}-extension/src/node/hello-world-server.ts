import { injectable } from 'inversify';
import { HelloWorldServer } from '../common/hello-world-protocol';

@injectable()
export class HelloWorldServerImpl implements HelloWorldServer {
    say(): Promise<string> {
        return Promise.resolve('Hello world.');
    }
}
