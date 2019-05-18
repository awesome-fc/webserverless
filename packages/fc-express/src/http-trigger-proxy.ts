import { Resolver, HttpTriggerContext } from './proxy-protocol';
import * as url from 'url';
import { AbstractProxy } from './abstract-proxy';
import * as getRawBody from 'raw-body';

export class HttpTriggerProxy extends AbstractProxy<HttpTriggerContext> {

    protected getBody(ctx: HttpTriggerContext): Promise<Buffer | undefined> {
        return getRawBody(ctx.request);
    }

    protected getRequestHeaders(ctx: HttpTriggerContext) {
        const request = ctx.request;
        const headers = Object.assign({}, request.headers);
        return Promise.resolve(headers);
    }

    protected getHttpMethod(ctx: HttpTriggerContext): string {
        return ctx.request.method;
    }

    protected getPath(ctx: HttpTriggerContext): string {
        const request = ctx.request;
        return url.format({ pathname: request.path, query: request.queries });
    }

    protected makeResolver(ctx: HttpTriggerContext): Resolver {
        return data => {
            const response = ctx.response;
            response.setStatusCode(data.statusCode);
            for (const key in data.headers) {
                if (data.headers.hasOwnProperty(key)) {
                    const value = data.headers[key];
                    response.setHeader(key, value);
                }
            }
            response.send(data.body);
        };
    }

}
