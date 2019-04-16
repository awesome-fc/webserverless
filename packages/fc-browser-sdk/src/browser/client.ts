import * as querystring from 'querystring';
import { enc, MD5, HmacSHA256 } from 'crypto-js';
import * as helper from './helper';

// const pkg = require('../../package.json');

export interface Config {
    accountId: string
    headers: any
    accessKeyId: string
    accessKeySecret: string
    securityToken?: string
    region: string
    secure: true
    timeout?: number
}

export class Client {
    private readonly version = '2016-08-15';
    private host: string;
    private endpoint: string;

    constructor(
        protected config: Config) {

        this.config = { headers: {}, timeout: 60000, ...this.config };
        this.validteConfig();

        const protocol = config.secure ? 'https' : 'http';

        this.host = `${config.accountId}.${config.region}.fc.aliyuncs.com`;
        this.endpoint = `${protocol}://${this.host}`;
    }

    private validteConfig() {
        if (this.config.accessKeyId.startsWith('STS')) {
            if (!this.config.securityToken) {
                throw new TypeError('"config.securityToken" must be passed in for STS');
            }
        }

    }

    private timeout(ms: number = 60000, promise: Promise<Response>): Promise<Response> {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                reject(new Error('timeout'));
            }, ms);
            promise.then(resolve, reject);
        });
    }

    buildHeaders() {
        const now = new Date();
        const headers: any = {
            'accept': 'application/json',
            'x-fc-date': now.toUTCString(),
            'host': this.host,
            'x-fc-account-id': this.config.accountId
        };

        if (this.config.securityToken) {
            headers['x-fc-security-token'] = this.config.securityToken;
        }
        return headers;
    }

    async request(method: string, path: string, query?: any, body?: any, headers: any = {}, opts: any = {}) {
        let url = `${this.endpoint}/${this.version}${path}`;
        if (query && Object.keys(query).length > 0) {
            url = `${url}?${querystring.stringify(query)}`;
        }

        headers = Object.assign(this.buildHeaders(), this.config.headers, headers);
        let postBody;
        if (body) {
            let buff;
            if (Buffer.isBuffer(body)) {
                buff = body;
                headers['content-type'] = 'application/octet-stream';
            } else if (typeof body === 'string') {
                buff = new Buffer(body, 'utf8');
                headers['content-type'] = 'application/octet-stream';
            } else {
                buff = new Buffer(JSON.stringify(body), 'utf8');
                headers['content-type'] = 'application/json';
            }
            const digest = MD5(buff.toString()).toString(enc.Hex);
            const md5 = new Buffer(digest, 'utf8').toString('base64');
            headers['content-length'] = buff.length;
            headers['content-md5'] = md5;
            postBody = buff;
        }

        let queriesToSign;
        if (path.startsWith('/proxy/')) {
            queriesToSign = query || {};
        }
        const signature = Client.getSignature(this.config.accessKeyId, this.config.accessKeySecret, method, `/${this.version}${path}`, headers, queriesToSign);
        headers['authorization'] = signature;
        const response = await this.timeout(this.config.timeout, fetch(url, {
            method,
            headers,
            body: postBody
        }));

        let responseBody: any;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.startsWith('application/json')) {
            responseBody = await response.json();
        } else {
            responseBody = await response.text();
        }

        if (!response.ok) {
            const status = response.status;
            const requestid = response.headers.get('x-fc-request-id');
            const err = new Error(`${method} ${path} failed with ${status}. requestid: ${requestid}, message: ${responseBody.ErrorMessage}.`);
            err.name = `FC${responseBody.ErrorCode}Error`;
            throw err;
        }

        return {
            'headers': response.headers,
            'data': responseBody,
        };
    }

    /*!
     * GET 请求
     *
     * @param {String} path 请求路径
     * @param {Object} query 请求中的 query 部分
     * @param {Object} headers 请求中的自定义 headers 部分
     * @return {Promise} 返回 Response
     */
    get(path: string, query?: any, headers?: any) {
        return this.request('GET', path, query, undefined, headers);
    }

    /*!
     * POST 请求
     *
     * @param {String} path 请求路径
     * @param {Buffer|String|Object} body 请求中的 body 部分
     * @param {Object} headers 请求中的自定义 headers 部分
     * @param {Object} queries 请求中的自定义 queries 部分
     * @return {Promise} 返回 Response
     */
    post(path: string, body?: any, headers?: any, queries?: any, opts: any = {}) {
        return this.request('POST', path, queries, body, headers, opts);
    }

    /*!
     * PUT 请求
     *
     * @param {String} path 请求路径
     * @param {Buffer|String|Object} body 请求中的 body 部分
     * @param {Object} headers 请求中的自定义 headers 部分
     * @return {Promise} 返回 Response
     */
    put(path: string, body?: string, headers?: any) {
        return this.request('PUT', path, undefined, body, headers);
    }

    /*!
     * DELETE 请求
     *
     * @param {String} path 请求路径
     * @param {Object} query 请求中的 query 部分
     * @param {Object} headers 请求中的自定义 headers 部分
     * @return {Promise} 返回 Response
     */
    delete(path: string, query?: any, headers?: any) {
        return this.request('DELETE', path, query, undefined, headers);
    }

    /**
     * 创建Service
     *
     * Options:
     * - description Service的简短描述
     * - logConfig log config
     * - role Service role
     *
     * @param {String} serviceName 服务名
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[ServiceResponse])
     */
    createService(serviceName: string, options: any = {}, headers?: any) {
        return this.post('/services', Object.assign({
            serviceName,
        }, options), headers);
    }

    /**
     * 获取Service列表
     *
     * Options:
     * - limit
     * - prefix
     * - startKey
     * - nextToken
     *
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[Service 列表])
     */
    listServices(options: any = {}, headers?: any) {
        return this.get('/services', options, headers);
    }

    /**
     * 获取service信息
     *
     * @param {String} serviceName
     * @param {Object} headers
     * @param {String} qualifier
     * @return {Promise} 返回 Object(包含headers和data属性[Service 信息])
     */
    getService(serviceName: string, headers: any = {}, qualifier?: any) {
        return this.get(`/services/${this.getServiceName(serviceName, qualifier)}`, undefined, headers);
    }

    /**
     * 更新Service信息
     *
     * Options:
     * - description Service的简短描述
     * - logConfig log config
     * - role service role
     *
     * @param {String} serviceName 服务名
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[Service 信息])
     */
    updateService(serviceName: string, options: any = {}, headers?: any) {
        return this.put(`/services/${serviceName}`, options, headers);
    }

    /**
     * 删除Service
     *
     * @param {String} serviceName
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    deleteService(serviceName: string, options: any = {}, headers?: any) {
        return this.delete(`/services/${serviceName}`, options, headers);
    }

    /**
     * 创建Function
     *
     * Options:
     * - description function的简短描述
     * - code function代码
     * - functionName
     * - handler
     * - initializer
     * - memorySize
     * - runtime
     * - timeout
     * - initializationTimeout
     *
     * @param {String} serviceName 服务名
     * @param {Object} options Function配置
     * @return {Promise} 返回 Function 信息
     */
    createFunction(serviceName: string, options?: any, headers?: any) {
        this.normalizeParams(options);
        return this.post(`/services/${serviceName}/functions`, options, headers);
    }

    normalizeParams(opts: any) {
        if (opts.functionName) {
            opts.functionName = String(opts.functionName);
        }

        if (opts.runtime) {
            opts.runtime = String(opts.runtime);
        }

        if (opts.handler) {
            opts.handler = String(opts.handler);
        }

        if (opts.initializer) {
            opts.initializer = String(opts.initializer);
        }

        if (opts.memorySize) {
            opts.memorySize = parseInt(opts.memorySize, 10);
        }

        if (opts.timeout) {
            opts.timeout = parseInt(opts.timeout, 10);
        }

        if (opts.initializationTimeout) {
            opts.initializationTimeout = parseInt(opts.initializationTimeout, 10);
        }
    }

    /**
     * 获取Function列表
     *
     * Options:
     * - limit
     * - prefix
     * - startKey
     * - nextToken
     *
     * @param {String} serviceName
     * @param {Object} options 选项，optional
     * @param {Object} headers
     * @param {String} qualifier 可选
     * @return {Promise} 返回 Object(包含headers和data属性[Function列表])
     */
    listFunctions(serviceName: string, options: any = {}, headers: any = {}, qualifier?: string) {
        return this.get(`/services/${this.getServiceName(serviceName, qualifier)}/functions`, options, headers);
    }

    /**
     * 获取Function信息
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {Object} headers
     * @param {String} qualifier 可选
     * @return {Promise} 返回 Object(包含headers和data属性[Function信息])
     */
    getFunction(serviceName: string, functionName: string, headers: any = {}, qualifier?: string) {
        return this.get(`/services/${this.getServiceName(serviceName, qualifier)}/functions/${functionName}`, undefined, headers);
    }

    /**
     * 获取Function Code信息
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {Object} headers
     * @param {String} qualifier 可选
     * @return {Promise} 返回 Object(包含headers和data属性[Function信息])
     */
    getFunctionCode(serviceName: string, functionName: string, headers: any = {}, qualifier?: string) {
        return this.get(`/services/${this.getServiceName(serviceName, qualifier)}/functions/${functionName}/code`, headers);
    }

    /**
     * 更新Function信息
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {Object} options Function配置，见createFunction
     * @return {Promise} 返回 Object(包含headers和data属性[Function信息])
     */
    updateFunction(serviceName: string, functionName: string, options: any, headers?: any) {
        this.normalizeParams(options);
        const path = `/services/${serviceName}/functions/${functionName}`;
        return this.put(path, options, headers);
    }

    /**
     * 删除Function
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    deleteFunction(serviceName: string, functionName: string, options: any = {}, headers?: any) {
        const path = `/services/${serviceName}/functions/${functionName}`;
        return this.delete(path, options, headers);
    }

    /**
     * 调用Function
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {Object} event event信息
     * @param {Object} headers
     * @param {String} qualifie
     * @return {Promise} 返回 Object(包含headers和data属性[返回Function的执行结果])
     */
    invokeFunction(serviceName: string, functionName: string, event: string | Buffer, headers: any = {}, qualifier?: string, opts: any = {}) {
        if (event && typeof event !== 'string' && !Buffer.isBuffer(event)) {
            throw new TypeError('"event" must be String or Buffer');
        }

        const path = `/services/${this.getServiceName(serviceName, qualifier)}/functions/${functionName}/invocations`;
        return this.post(path, event, headers, undefined, opts);
    }

    /**
     * 创建Trigger
     *
     * Options:
     * - invocationRole
     * - sourceArn
     * - triggerType
     * - triggerName
     * - triggerConfig
     * - qualifier
     *
     * @param {String} serviceName 服务名
     * @param {String} functionName 服务名
     * @param {Object} options Trigger配置
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性[Trigger信息])
     */
    createTrigger(serviceName: string, functionName: string, options: any, headers: any = {}) {
        const path = `/services/${serviceName}/functions/${functionName}/triggers`;
        return this.post(path, options, headers);
    }

    /**
     * 获取Trigger列表
     *
     * Options:
     * - limit
     * - prefix
     * - startKey
     * - nextToken
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[Trigger列表])
     */
    listTriggers(serviceName: string, functionName: string, options: any = {}, headers?: any) {
        const path = `/services/${serviceName}/functions/${functionName}/triggers`;
        return this.get(path, options, headers);
    }

    /**
     * 获取Trigger信息
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {String} triggerName
     * @return {Promise} 返回 Object(包含headers和data属性[Trigger信息])
     */
    getTrigger(serviceName: string, functionName: string, triggerName: string, headers?: any) {
        const path = `/services/${serviceName}/functions/${functionName}/triggers/${triggerName}`;
        return this.get(path, undefined, headers);
    }

    /**
     * 更新Trigger信息
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {String} triggerName
     * @param {Object} options Trigger配置，见createTrigger
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性[Trigger信息])
     */
    updateTrigger(serviceName: string, functionName: string, triggerName: string, options: any = {}, headers: any = {}) {
        const path = `/services/${serviceName}/functions/${functionName}/triggers/${triggerName}`;
        return this.put(path, options, headers);
    }

    /**
     * 删除Trigger
     *
     * @param {String} serviceName
     * @param {String} functionName
     * @param {String} triggerName
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    deleteTrigger(serviceName: string, functionName: string, triggerName: string, options?: any, headers?: any) {
        const path = `/services/${serviceName}/functions/${functionName}/triggers/${triggerName}`;
        return this.delete(path, options, headers);
    }

    /**
     * 创建CustomDomain
     *
     * Options:
     * - protocol
     * - routeConfig
     *
     * @param {String} domainName 域名
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[CustomDomainResponse])
     */
    createCustomDomain(domainName: string, options: any = {}, headers?: any) {
        return this.post('/custom-domains', Object.assign({
            domainName,
        }, options), headers);
    }

    /**
     * 获取CustomDomain列表
     *
     * Options:
     * - limit
     * - prefix
     * - startKey
     * - nextToken
     *
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[CustomDomain 列表])
     */
    listCustomDomains(options = {}, headers?: any) {
        return this.get('/custom-domains', options, headers);
    }

    /**
     * 获取CustomDomain信息
     *
     * @param {String} domainName
     * @return {Promise} 返回 Object(包含headers和data属性[CustomDomain 信息])
     */
    getCustomDomain(domainName: string, headers: any) {
        return this.get(`/custom-domains/${domainName}`, undefined, headers);
    }

    /**
     * 更新CustomDomain信息
     *
     * Options:
     * - protocol
     * - routeConfig
     *
     * @param {String} domainName
     * @param {Object} options 选项，optional
     * @return {Promise} 返回 Object(包含headers和data属性[Service 信息])
     */
    updateCustomDomain(domainName: string, options: any = {}, headers: any) {
        return this.put(`/custom-domains/${domainName}`, options, headers);
    }

    /**
     * 删除CustomDomain
     *
     * @param {String} domainName
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    deleteCustomDomain(domainName: string, options: any = {}, headers: any) {
        return this.delete(`/custom-domains/${domainName}`, options, headers);
    }

    /**
     * 创建 version
     *
     * @param {String} serviceName
     * @param {String} description
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性[Version 信息])
     */
    publishVersion(serviceName: string, description?: string, headers?: any) {
        const body: any = {};
        if (description) {
            body.description = description;
        }
        return this.post(`/services/${serviceName}/versions`, body, headers || {});
    }

    /**
     * 列出 version
     *
     * Options:
     * - limit
     * - nextToken
     * - startKey
     * - direction
     *
     * @param {String} serviceName
     * @param {Object} options
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性[Version 信息])
     */
    listVersions(serviceName: string, options: any = {}, headers: any = {}) {
        return this.get(`/services/${serviceName}/versions`, options, headers);
    }

    /**
     * 删除 version
     *
     * @param {String} serviceName
     * @param {String} versionId
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    deleteVersion(serviceName: string, versionId: string, headers: any = {}) {
        return this.delete(`/services/${serviceName}/versions/${versionId}`, undefined, headers);
    }

    /**
     * 创建 Alias
     *
     * Options:
     * - description
     * - additionalVersionWeight
     *
     * @param {String} serviceName
     * @param {String} aliasName
     * @param {String} versionId
     * @param {Object} options
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    createAlias(serviceName: string, aliasName: string, versionId: string, options: any = {}, headers: any = {}) {
        options.aliasName = aliasName;
        options.versionId = versionId;

        return this.post(`/services/${serviceName}/aliases`, options, headers);
    }

    /**
     * 删除 Alias
     *
     * @param {String} serviceName
     * @param {String} aliasName
     * @param {String} headers
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    deleteAlias(serviceName: string, aliasName: string, headers = {}) {
        return this.delete(`/services/${serviceName}/aliases/${aliasName}`, undefined, headers);
    }

    /**
     * 列出 alias
     *
     * Options:
     * - limit
     * - nextToken
     * - prefix
     * - startKey
     *
     * @param {String} serviceName
     * @param {Object} options
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    listAliases(serviceName: string, options: any = {}, headers: any = {}) {
        return this.get(`/services/${serviceName}/aliases`, options, headers);
    }

    /**
     * 获得 alias
     *
     * @param {String} serviceName
     * @param {String} aliasName
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    getAlias(serviceName: string, aliasName: string, headers: any = {}) {
        return this.get(`/services/${serviceName}/aliases/${aliasName}`, undefined, headers);
    }

    /**
     * 更新 alias
     *
     * Options:
     * - description
     * - additionalVersionWeight
     *
     * @param {String} serviceName
     * @param {String} aliasName
     * @param {String} versionId
     * @param {Object} options
     * @param {Object} headers
     * @return {Promise} 返回 Object(包含headers和data属性)
     */
    updateAlias(serviceName: string, aliasName: string, versionId?: string, options: any = {}, headers: any = {}) {
        if (versionId) {
            options.versionId = versionId;
        }
        return this.put(`/services/${serviceName}/aliases/${aliasName}`, options, headers);
    }

    private getServiceName(serviceName: string, qualifier?: string) {
        if (qualifier) {
            return `${serviceName}.${qualifier}`;
        }
        return serviceName;
    }

    static signString(source: string, secret: string) {
        const buff = HmacSHA256(new Buffer(source, 'utf8').toString(), secret);
        return buff.toString(enc.Base64);
    }

    /**
     * 获得Header 签名
     *
     * @param {String} accessKeyId
     * @param {String} accessKeySecret
     * @param {String} method : GET/POST/PUT/DELETE/HEAD
     * @param {String} path
     * @param {json} headers : {headerKey1 : 'headValue1'}
     */
    static getSignature(accessKeyId: string, accessKeySecret: string, method: string, path: string, headers: any, queries: any) {
        const stringToSign = helper.composeStringToSign(method, path, headers, queries);
        const sign = Client.signString(stringToSign, accessKeySecret);
        return `FC ${accessKeyId}:${sign}`;
    }
}
