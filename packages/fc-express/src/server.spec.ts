import { expect } from 'chai';
import * as express from 'express';
import { Server } from './server';
import { Callback, CONTEXT_HEADER_NAME, EVENT_HEADER_NAME } from './proxy-protocol';
import * as events from 'events';
import * as getRawBody from 'raw-body';
import { eventContext } from './middleware';

class Response {
    statusCode: number;
    headers: any = {};
    body?: string;
    setStatusCode(statusCode: number) {
        this.statusCode = statusCode;
    }

    setHeader(key: string, value: any) {
        this.headers[key] = value;
    }

    send(body?: string) {
        this.body = body;
    }
}

const makeRequest = () => {
    const ee: any = new events.EventEmitter();
    ee.path = '/foo';
    ee.method = 'post';
    ee.queries = { foo: 'bar' };
    ee.headers = {
        foo: 'bar'
    };
    return ee;
};

const send = (request: events.EventEmitter, data: string) => {
    process.nextTick(() => {
        request.emit('data', Buffer.from('bar'));
        request.emit('end');
    });
};

describe('base sever', function () {

    it('should get status without error', function (done) {
        const s = new Server(express(), () => {
            expect(s.isListening).to.be.true;
            done();
        });
        expect(s.socketPathSuffix).to.not.empty;
        expect(s.isListening).to.be.false;
        s.startServer();
    });

});

describe('http trigger sever', function () {
    const fcHttpTriggerFunction = (app: any) => {
        const server = new Server(app);
        return {
            handler(req: any, res: any, ctx: any) {
                server.httpProxy(req, res, ctx);
            }
        };

    };

    it('should pass without error', function (done) {
        const app = express();
        const request = makeRequest();
        const response = new Response();
        app.post('/foo', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            expect(req.headers.foo).equal('bar');
            expect(req.headers[CONTEXT_HEADER_NAME]).to.not.empty;
            expect(req.query).deep.equal(request.headers);
            res.setHeader('foo', 'bar');
            res.send('bar');
        });
        response.send = data => {
            expect(response.headers.foo).equal('bar');
            expect(data).equal('bar');
            done();
        };
        fcHttpTriggerFunction(app).handler(request, response, {});
        send(request, 'bar');
    });

    it('should use middleware with default options', function (done) {
        const app = express();
        const request = makeRequest();
        const response = new Response();
        const context = { foo: 'bar' };
        app.use(eventContext());
        app.post('/foo', async (req, res) => {
            expect((req as any).eventContext.event).to.be.undefined;
            expect((req as any).eventContext.context).deep.equal(context);
            expect(req.headers[CONTEXT_HEADER_NAME]).to.be.undefined;
            done();
        });
        fcHttpTriggerFunction(app).handler(request, response, context);
        send(request, 'bar');
    });

    it('should use middleware with reqPropKey is foo', function (done) {
        const app = express();
        const request = makeRequest();
        const response = new Response();
        const context = { foo: 'bar' };
        app.use(eventContext({ reqPropKey: 'foo' }));
        app.post('/foo', async (req, res) => {
            expect((req as any).foo.context).deep.equal(context);
            done();
        });
        fcHttpTriggerFunction(app).handler(request, response, context);
        send(request, 'bar');
    });

    it('should use middleware with deleteHeaders is false', function (done) {
        const app = express();
        const request = makeRequest();
        const response = new Response();
        const context = { foo: 'bar' };
        app.use(eventContext({ deleteHeaders: false }));
        app.post('/foo', async (req, res) => {
            expect(req.headers[CONTEXT_HEADER_NAME]).to.be.not.undefined;
            done();
        });
        fcHttpTriggerFunction(app).handler(request, response, context);
        send(request, 'bar');
    });

    it('should get body with req.body', function (done) {
        const app = express();
        const request = makeRequest();
        const response = new Response();
        const context = { foo: 'bar' };
        app.post('/foo', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            done();
        });
        request.body = 'bar';
        fcHttpTriggerFunction(app).handler(request, response, context);
    });

});

describe('api gateway sever', function () {
    const fcApiGatewayFunction = (app: any) => {
        const server = new Server(app);
        return {
            handler(e: any, ctx: any, callback: Callback) {
                server.proxy(e, ctx, callback);
            }
        };

    };

    const event = {
        'path': '/foo',
        'httpMethod': 'post',
        'headers': { foo: 'bar' },
        'queryParameters': { foo: 'bar' },
        'pathParameters': {},
        'body': 'bar',
        'isBase64Encoded':  false
    };

    it('should pass without error', function (done) {
        const app = express();
        app.post('/foo', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            expect(req.headers.foo).equal('bar');
            expect(req.headers[EVENT_HEADER_NAME]).to.not.undefined;
            expect(req.headers[CONTEXT_HEADER_NAME]).to.not.undefined;
            expect(req.query).deep.equal(event.headers);
            res.setHeader('foo', 'bar');
            res.send('bar');
        });

        fcApiGatewayFunction(app).handler(JSON.stringify(event), {}, (err, data) => {
            expect(data.headers.foo).equal('bar');
            expect(data.body).equal('bar');
            done();
        });
    });

    it('should returns 404', function (done) {
        const app = express();
        fcApiGatewayFunction(app).handler(JSON.stringify({...event, path: '/not-found'}), {}, (err, data) => {
            expect(data.statusCode).equal(404);
            done();
        });
    });

    it('should pass with Base64Encoded', function (done) {
        const app = express();
        app.post('/foo', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            done();
        });

        fcApiGatewayFunction(app).handler(JSON.stringify({...event, isBase64Encoded: true, body: Buffer.from('bar').toString('base64') }), {}, (err, data) => {
        });
    });

    it('should use middleware with default options', function (done) {
        const app = express();
        const context = { foo: 'bar' };
        app.use(eventContext());
        app.post('/foo', async (req, res) => {
            expect((req as any).eventContext.event.path).equal('/foo');
            expect((req as any).eventContext.context).deep.equal(context);
            expect(req.headers[EVENT_HEADER_NAME]).to.be.undefined;
            expect(req.headers[CONTEXT_HEADER_NAME]).to.be.undefined;
            done();
        });
        fcApiGatewayFunction(app).handler(JSON.stringify(event), context, (err, data) => {
        });
    });

    it('should use middleware with reqPropKey is foo', function (done) {
        const app = express();
        const context = { foo: 'bar' };
        app.use(eventContext({ reqPropKey: 'foo' }));
        app.post('/foo', async (req, res) => {
            expect((req as any).foo.event.path).equal('/foo');
            expect((req as any).foo.context).deep.equal(context);
            done();
        });
        fcApiGatewayFunction(app).handler(JSON.stringify(event), context, (err, data) => {
        });
    });

    it('should use middleware with deleteHeaders is false', function (done) {
        const app = express();
        const context = { foo: 'bar' };
        app.use(eventContext({ deleteHeaders: false }));
        app.post('/foo', async (req, res) => {
            expect(req.headers[EVENT_HEADER_NAME]).to.be.not.undefined;
            expect(req.headers[CONTEXT_HEADER_NAME]).to.be.not.undefined;
            done();
        });
        fcApiGatewayFunction(app).handler(JSON.stringify(event), context, (err, data) => {
        });
    });
});
