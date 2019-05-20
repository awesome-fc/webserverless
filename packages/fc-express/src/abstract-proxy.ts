import { Proxy, Resolver, Context, CONTEXT_HEADER_NAME } from './proxy-protocol';
import { Server } from './server';
import * as http from 'http';
import * as isType from 'type-is';

export abstract class AbstractProxy<T extends Context> implements Proxy<T> {

    constructor(protected readonly server: Server) {

    }

    handle(ctx: T): void {
        if (this.server.isListening) {
            this.forwardRequestToNodeServer(ctx);
        } else {
        this.server.startServer()
            .on('listening', () => {
                this.forwardRequestToNodeServer(ctx);
            });
        }
    }

    protected abstract makeResolver(ctx: T): Resolver;

    protected abstract pipeBody(ctx: T, req: http.ClientRequest): void;

    protected abstract getRequestHeaders(ctx: T): any;

    protected abstract getHttpMethod(ctx: T): string;

    protected abstract getPath(ctx: T): string;

    protected getResponseHeaders(response: http.IncomingMessage): http.IncomingHttpHeaders {
        return response.headers;
    }

    protected forwardRequestToNodeServer(ctx: T) {
        const resolver = this.makeResolver(ctx);
        try {
            const requestOptions = this.mapContextToHttpRequest(ctx);
            const req = http.request(requestOptions, response => this.forwardResponse(response, resolver));
            req.on('error', error => this.forwardConnectionErrorResponse(error, resolver));
            this.pipeBody(ctx, req);
        } catch (error) {
            this.forwardLibraryErrorResponse(error, resolver);
        }
    }

    protected mapContextToHttpRequest(ctx: T) {
        const headers = this.getRequestHeaders(ctx);
        headers[CONTEXT_HEADER_NAME] = encodeURIComponent(JSON.stringify(ctx.context));
        return {
            method: this.getHttpMethod(ctx),
            path: this.getPath(ctx),
            headers,
            socketPath: this.server.getSocketPath()
            // protocol: `${headers['X-Forwarded-Proto']}:`,
            // host: headers.Host,
            // hostname: headers.Host, // Alias for host
            // port: headers['X-Forwarded-Port']
        };
    }

    protected forwardResponse(response: http.IncomingMessage, resolver: Resolver) {
        const buf: any[] = [];

        response
            .on('data', chunk => buf.push(chunk))
            .on('end', () => {
                const bodyBuffer = Buffer.concat(buf);
                const statusCode = response.statusCode;
                const headers = this.getResponseHeaders(response);
                const contentType = this.getContentType({ contentTypeHeader: headers['content-type'] });
                const isBase64Encoded = this.isContentTypeBinaryMimeType({ contentType, binaryMimeTypes: this.server.binaryTypes });
                const body = bodyBuffer.toString(isBase64Encoded ? 'base64' : 'utf8');
                const successResponse = { statusCode, body, headers, isBase64Encoded };

                resolver(successResponse);
            });
    }

    protected clone(json: any) {
        return JSON.parse(JSON.stringify(json));
    }

    protected getContentType(params: any) {
        // only compare mime type; ignore encoding part
        return params.contentTypeHeader ? params.contentTypeHeader.split(';')[0] : '';
    }

    protected isContentTypeBinaryMimeType(params: any) {
        return params.binaryMimeTypes.length > 0 && !!isType.is(params.contentType, params.binaryMimeTypes);
    }

    protected forwardConnectionErrorResponse(error: Error, resolver: Resolver) {
        console.log('ERROR: fc-express connection error');
        console.error(error);
        const errorResponse = {
            statusCode: 502, // 'DNS resolution, TCP level errors, or actual HTTP parse errors' - https://nodejs.org/api/http.html#http_http_request_options_callback
            body: '',
            headers: {}
        };

        resolver(errorResponse);
    }

    protected forwardLibraryErrorResponse(error: Error, resolver: Resolver) {
        console.log('ERROR: fc-express error');
        console.error(error);
        const errorResponse = {
            statusCode: 500,
            body: '',
            headers: {}
        };

        resolver(errorResponse);
    }
}
