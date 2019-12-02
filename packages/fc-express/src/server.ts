import * as http from 'http';
import { Callback } from './proxy-protocol';
import { ApiGatewayProxy } from './api-gateway-proxy';
import { HttpTriggerProxy } from './http-trigger-proxy';

export class Server {
    socketPathSuffix: string;
    binaryTypes: string[];
    isListening: boolean = false;
    rawServer: http.Server;
    apiGatewayProxy: ApiGatewayProxy;
    httpTriggerProxy: HttpTriggerProxy;

    constructor(requestListener: (request: http.IncomingMessage, response: http.ServerResponse) => void, serverListenCallback?: () => void, binaryTypes?: string[]) {
        this.apiGatewayProxy = new ApiGatewayProxy(this);
        this.httpTriggerProxy = new HttpTriggerProxy(this);
        this.rawServer = http.createServer(requestListener);
        // Set the server's timeout to 600 seconds, which is the same as the FC's max timeout.
        this.rawServer.setTimeout(600 * 1000);

        this.socketPathSuffix = this.getRandomString();
        this.binaryTypes = binaryTypes ? binaryTypes.slice() : [];
        this.rawServer.on('listening', () => {
            this.isListening = true;

            if (serverListenCallback) {
                serverListenCallback();
            }
        });
        this.rawServer.on('close', () => {
            this.isListening = false;
        }).on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                console.warn(`WARNING: Attempting to listen on socket ${this.getSocketPath()}, but it is already in use.
                 This is likely as a result of a previous invocation error or timeout. Check the logs for the invocation(s) immediately prior to this for root cause,
                 and consider increasing the timeout and/or cpu/memory allocation if this is purely as a result of a timeout.
                 fc-express will restart the Node.js server listening on a new port and continue with this request.`);
                this.socketPathSuffix = this.getRandomString();
                return this.rawServer.close(() => this.startServer());
            } else {
                console.log('ERROR: server error');
                console.error(error);
            }
        });
    }

    proxy(event: any, context: any, callback: Callback) {
        const e = JSON.parse(event);
        this.apiGatewayProxy.handle({ event: e, context, callback });
    }

    httpProxy(request: any, response: any, context: any) {
        this.httpTriggerProxy.handle({ request, response, context });
    }

    startServer () {
        return this.rawServer.listen(this.getSocketPath());
    }

    protected getRandomString() {
        return Math.random().toString(36).substring(2, 15);
    }

    getSocketPath() {
        /* istanbul ignore if */ /* only running tests on Linux; Window support is for local dev only */
        if (/^win/.test(process.platform)) {
            const path = require('path');
            return path.join('\\\\?\\pipe', process.cwd(), `server-${this.socketPathSuffix}`);
        } else {
            return `/tmp/server-${this.socketPathSuffix}.sock`;
        }
    }

}
