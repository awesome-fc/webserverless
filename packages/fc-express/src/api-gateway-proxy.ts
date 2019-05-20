import { ApiGatewayContext, Resolver, EVENT_HEADER_NAME } from './proxy-protocol';
import * as url from 'url';
import * as http from 'http';
import { AbstractProxy } from './abstract-proxy';
const binarycase = require('binary-case');

export class ApiGatewayProxy extends AbstractProxy<ApiGatewayContext> {

    protected getResponseHeaders(response: http.IncomingMessage): http.IncomingHttpHeaders {
        const headers = response.headers;

        // chunked transfer not currently supported by API Gateway
        /* istanbul ignore else */
        if (headers['transfer-encoding'] === 'chunked') {
            delete headers['transfer-encoding'];
        }

        // HACK: modifies header casing to get around API Gateway's limitation of not allowing multiple
        // headers with the same name, as discussed on the AWS Forum https://forums.aws.amazon.com/message.jspa?messageID=725953#725953

        for (const h in headers) {
            if (headers.hasOwnProperty(h)) {
                const value = headers[h];
                if (Array.isArray(value)) {
                    if (h.toLowerCase() === 'set-cookie') {
                        value.forEach((v, i) => {
                            headers[binarycase(h, i + 1)] = v;
                        });
                        delete headers[h];
                    } else {
                        headers[h] = value.join(',');
                    }
                }
            }
        }
        return headers;
    }

    protected pipeBody(ctx: ApiGatewayContext, req: http.ClientRequest): void {
        const body = this.getBody(ctx);
        if (body) {
            req.write(body);
        }
        req.end();
    }

    protected getBody(ctx: ApiGatewayContext): Buffer | undefined {
        const event = ctx.event;
        if (event.body) {
            return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
        }
    }

    protected getRequestHeaders(ctx: ApiGatewayContext) {
        const event = ctx.event;
        const headers = Object.assign({}, event.headers);

        // NOTE: API Gateway is not setting Content-Length header on requests even when they have a body
        if (event.body && !headers['Content-Length']) {
            const body = this.getBody(ctx);
            if (body) {
                headers['Content-Length'] = body ? Buffer.byteLength(body) : 0;
            }
        }

        const clonedEventWithoutBody = this.clone(event);
        delete clonedEventWithoutBody.body;

        headers[EVENT_HEADER_NAME] = encodeURIComponent(JSON.stringify(clonedEventWithoutBody));
        return headers;
    }

    protected getHttpMethod(ctx: ApiGatewayContext): string {
        return ctx.event.httpMethod;
    }

    protected getPath(ctx: ApiGatewayContext): string {
        const event = ctx.event;
        return url.format({ pathname: event.path, query: event.queryParameters });
    }

    protected makeResolver(ctx: ApiGatewayContext): Resolver {
        return data => ctx.callback(undefined, data);
    }

}
