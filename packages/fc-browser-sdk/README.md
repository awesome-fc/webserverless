# Webserverless - FC Browser SDK extension

`fc-browser-sdk` 可以在浏览器端使用的函数计算 SDK，在浏览器中使用本包，会存在 AK 泄露的风险，万不可使用主账号的 AK。

## 使用方式

```javascript
const client = new Client({
    accessKeyId: '[您的 accessKeyId]',
    accessKeySecret: '[您的 accessKeySecret]',
    accountId: '[您的主账号 accountId]',
    region: '[您的需要操作的 region]'
});

const { services } = await client.listServices();
```