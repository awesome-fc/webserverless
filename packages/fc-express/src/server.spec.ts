import { expect } from 'chai';
import * as express from 'express';
import { Server } from './server';
import { Callback } from './proxy-protocol';
import * as events from 'events';
import * as getRawBody from 'raw-body';

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
        console.log('ssssss');
        this.body = body;
    }
}

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
    const app = express();
    const server = new Server(app);
    const fcHttpTriggerFunction = {
        handler(req: any, res: any, ctx: any) {
            server.httpProxy(req, res, ctx);
        }
    };

    it('should pass without error', function (done) {
        const ee: any = new events.EventEmitter();
        ee.path = '/foo';
        ee.method = 'post';
        ee.queries = { foo: 'bar' };
        ee.headers = {
            foo: 'bar'
        };
        const response = new Response();
        app.post('/foo', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            expect(req.headers.foo).equal('bar');
            expect(req.headers['x-fc-express-context']).to.not.empty;
            expect(req.query).deep.equal(ee.headers);
            res.setHeader('foo', 'bar');
            res.send('bar');
        });
        response.send = data => {
            expect(response.headers.foo).equal('bar');
            expect(data).equal('bar');
            done();
        };
        fcHttpTriggerFunction.handler(ee, response, {});
        process.nextTick(() => {
            ee.emit('data', Buffer.from('bar'));
            ee.emit('end');
        });
    });

});

describe('api gateway sever', function () {
    const app = express();
    const server = new Server(app);
    const fcApiGatewayFunction = {
        handler(e: any, ctx: any, callback: Callback) {
            server.proxy(e, ctx, callback);
        }
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

        app.post('/foo', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            expect(req.headers.foo).equal('bar');
            expect(req.headers['x-fc-express-event']).to.not.empty;
            expect(req.headers['x-fc-express-context']).to.not.empty;
            expect(req.query).deep.equal(event.headers);
            res.setHeader('foo', 'bar');
            res.send('bar');
        });

        fcApiGatewayFunction.handler(JSON.stringify(event), {}, (err, data) => {
            expect(data.headers.foo).equal('bar');
            expect(data.body).equal('bar');
            done();
        });
    });

    it('should returns 404', function (done) {
        fcApiGatewayFunction.handler(JSON.stringify({...event, path: '/not-found'}), {}, (err, data) => {
            expect(data.statusCode).equal(404);
            done();
        });
    });

    it('should pass with Base64Encoded', function (done) {
        app.post('/foo1', async (req, res) => {
            expect((await getRawBody(req)).toString()).equal('bar');
            done();
        });

        fcApiGatewayFunction.handler(JSON.stringify({...event, path: '/foo1', isBase64Encoded: true, body: Buffer.from('bar').toString('base64') }), {}, (err, data) => {
        });
    });
});
