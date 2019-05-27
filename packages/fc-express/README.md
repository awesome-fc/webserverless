# Webserverless - FC Express extension

<a name="WNjE0"></a>
## 背景

目前有很多 web 应用是基于 express 框架写的，这样的 web 应用按照传统的部署方式可能部署在云主机上，用户可能不想购买云主机，也不想在运维上投入太多成本，函数计算是一个不错的选择。函数计算的入口方法如何适配 express 是一个相当复杂的问题，我们需要适配 http 触发器和 API 网关这两种类型，因为，这两种类型的函数方法签名是不一样的。比如 API 网关方式触发函数，需要把 event 映射到 express 的 request 对象上，而 express 的 response 对象需要映射到 callback 的数据参数上。

现在，我们提供了一个 npm 包，基于该 npm 包，可以将函数计算的请求转发给 express 应用，几行代码可以实现。

如果你需要快速开始，可以参考另一篇文章：[开发函数计算的正确姿势——移植 Express](https://yq.aliyun.com/articles/703320)。
<a name="Gv3g4"></a>
## 使用说明

<a name="BbZxJ"></a>
#### 安装相关 npm 包

```bash
npm install @webserverless/fc-express express
```

<a name="akT1c"></a>
#### http 触发器类型函数

```javascript
const proxy = require('@webserverless/fc-express')
const express = require('express');

const app = express();
app.all('*', (req, res) => {
  res.send('hello world!');
});

const server = new proxy.Server(app);

module.exports.handler = function(req, res, context) {
  server.httpProxy(req, res, context);
};
```

<a name="buYgl"></a>
#### API 网关类型函数

```javascript
const proxy = require('@webserverless/fc-express')
const express = require('express');

const app = express();
app.all('*', (req, res) => {
  res.send('hello world!');
});

const server = new proxy.Server(app);

module.exports.handler = function(event, context, callback) {
  server.proxy(event, context, callback);
};
```

<a name="rhIze"></a>
#### http 触发器类型自定义 body

http 触发器触发函数，会通过流的方式传输 body 信息，我们可以通过 npm 包 raw-body 来获取，获取流中 body 信息需要特别注意一点：在 node8 版本以下（包括 nodejs8），获取 body 信息的代码逻辑一定要在其他 await 或者 promise.then 等方法的前面，在某些特殊场景下，可能需要让 server.httpProxy 方法需要在一个 await 代码后面执行，再这种情况下，我们就需要自己手动获取 body，然后通过一种特殊的方式传递给代理服务。本质原因与 nodejs 的 Eevent Loop 机制有关。代码如下

```javascript
const proxy = require('@webserverless/fc-express')
const express = require('express');
const getRawBody = require('raw-body');

const app = express();
app.all('*', (req, res) => {
  res.send('hello world!');
});

const server = new proxy.Server(app);

const init = async () => {
	.....
}

module.exports.handler = async (req, res, context) => {
  req.body = await getRawBody(req); // 本行代码一定要放到其他 await 代码之前
  await init();
  server.httpProxy(req, res, context);
};
```

<a name="LvUWf"></a>
#### 获取请求头

我们在浏览器端设置好请求头，@webserverless/fc-express 会将我们的请求头透传给 express 应用的 request 对象，通过 express 的 request 对象直接获取我们设置的请求头

<a name="7rV7s"></a>
#### 设置响应头

我们只需要按照 express 方式设置好 response 的响应头，@webserverless/fc-express 会把该响应头透传出来，在浏览器可以获取透传出来的响应头。

<a name="XDJmA"></a>
#### Server 说明
@webserverless/fc-express 包导出了一个 Server 类，Server 负责构建代理服务，转发请求到 express 应用。

1. 构造函数定义：

```typescript
Server(
  requestListener: (request: http.IncomingMessage, response: http.ServerResponse) => void,
  serverListenCallback?: () => void,
  binaryTypes?: string[]
  )
```

2. 构造函数参数说明：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| requestListener | (request: http.IncomingMessage, response: http.ServerResponse) => void | 是 | 被代理的 express 应用 |
| serverListenCallback | () => void | 否 | http 代理服务开始监听的回调函数 |
| binaryTypes | string[] | 否 | API 网关触发方式才有效，当 express 应用的响应头 content-type 符合 binaryTypes 中定义的任意规则，则返回给 API 网关的 isBase64Encoded 属性为 true |

3. 成员方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| proxy | (event, context, callback) | void | 当你的函数通过 API 网关触发，就需要使用 proxy 方法将函数计算的处理代理给 express 应用，参数对应着 API 网关类型的入口函数的参数 |
| httpProxy | (request, response, context) | void | 当你的函数通过 http 触发器触发，就需要使用 httpProxy 方法将函数计算的处理代理给 express 应用，参数对应着 http 触发器类型的入口函数的参数 |

4. 成员属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| rawServer | http.Server | 负责将请求转发 express 应用的底层代理服务对象 |

<a name="C9x8U"></a>
#### API 网关中的 isBase64Encoded 参数

有两个地方会有 isBase64Encoded 参数：

1. 函数 event 参数中包含的 isBase64Encoded 参数
1. 函数返回值中包含的 isBase64Encoded 参数

当函数的 event.isBase64Encoded 是 true 时，我们会按照 base64 编码来解析 event.body，并透传给 express 应用，否则就按照默认的编码方式来解析，默认是 utf8。

当 express 应用响应的 content-type 符合 Server 构造函数参数 binaryTypes 中定义的任意规则时，则函数的返回值的 isBase64Encoded 为 true，从而告诉 API 网关如何解析函数返回值的 body 参数。

<a name="squlh"></a>
#### 业务代码中获取函数 context 和 event 方法

我们提供了一个 express 中间件，用来获取函数的 event 和 context 对象，其中 event 对象，只有在 API 网关触发函数的时候才会有，且 event 是 JSON.parse 后的对象。代码如下：

```javascript
const proxy = require('@webserverless/fc-express')
const express = require('express');
const app = express();
app.use(proxy.eventContext())
app.all('*', (req, res) => {
  console.log(req.eventContext.event); // http 触发器方式，没有 event 对象
  console.log(req.eventContext.context);
  res.send('hello world!');
});

const server = new proxy.Server(app);

module.exports.handler = function(event, context, callback) {
  server.proxy(event, context, callback);
};
```

eventContext 中间件之所以能解析到 event 和 context 两个参数，是因为我们会将这两个参数序列化后，通过请求头透传给了 express 应用的 reques 对象。<br />eventContext 中间件提供了一个配置参数 options，options 参数是选填的，其中包含了两个属性 reqPropKey 和 deleteHeaders：

| 参数 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| reqPropKey | string | 'eventContext' | 否 |  控制从请求头解析出 event 和 context 对象放到 request 对象的属性名称，默认是 eventContext，则获取方式为request.eventContext.event |
| deleteHeaders | boolean | true | 否 | 控制从请求头解析出 event 和 context 后，是否需要删除与 event 和 context 相关的请求头，默认会删除 |

<a name="k2ciI"></a>
## 需要考虑的问题

- 无状态的。所以移植后的 express 也需要是无状态的，像 express session 就没法简单的用起来了，可以考虑使用 jwt 或者将状态持久化到相关存储中
- 冷启动。第一次访问有冷启动时间，一段时间没有请求，函数计算会释放掉实例，下次再有请求过来，也会有冷启动时间，可以通过预热来解决，另外，打包压缩代码，也可以减少冷启动时间
- 部分浏览器请求对象属性没有从函数计算中透传出来，比如：protocol、hostname 等，所以在 express 应用中无法获取
- 函数计算的最大超时时间 600 秒，API 网关最大超时时间是 30 秒，如果你使用了 API 网关，请确保你的请求能在 30 秒内处理完，如果你使用了 http 触发器，请确保你的请求能在 600 秒内处理完
- 无法使用本地库(像 [Addons](https://nodejs.org/api/addons.html)) 

<a name="UyxZq"></a>
## 小结

使用 @webserverless/fc-express 包，我们可以几行代码让 express 接入函数计算，@webserverless/fc-express 会帮我们做很多适配的事情，让我们尽可能接近原生的方式使用 express 框架，适配的逻辑对用户是透明的。另外，我们还提供了一个 fun 模板，帮助我们更快地搭建一个基于函数计算的 express 项目，预置了编译、打包、调试和发布等开箱即用的功能，可以参考另一篇文章：[开发函数计算的正确姿势——移植 Express](https://yq.aliyun.com/articles/703320)。

