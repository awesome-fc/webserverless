const url = require('url');

const buildCanonicalHeaders = (headers: any = {}, prefix: string) => {
    const list = [];
    const keys = Object.keys(headers);
    const fcHeaders: any = {};

    for (const key of keys) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey.startsWith(prefix)) {
            list.push(lowerKey);
            fcHeaders[lowerKey] = headers[key];
        }
    }
    list.sort();

    let canonical = '';
    for (const key of list) {
        canonical += `${key}:${fcHeaders[key]}\n`;
    }

    return canonical;
};

export const composeStringToSign = (method: string, path: string, headers: any, queries: any) => {
    const contentMD5 = headers['content-md5'] || '';
    const contentType = headers['content-type'] || '';
    const date = headers['x-fc-date'];
    const signHeaders = buildCanonicalHeaders(headers, 'x-fc-');

    const u = url.parse(path);
    const pathUnescaped = decodeURIComponent(u.pathname);
    let str = `${method}\n${contentMD5}\n${contentType}\n${date}\n${signHeaders}${pathUnescaped}`;

    if (queries) {
        const params: any[] = [];
        Object.keys(queries).forEach(function (key) {
            const values = queries[key];
            const type = typeof values;
            if (type === 'string') {
                params.push(`${key}=${values}`);
                return;
            }
            if (Array.isArray(values)) {
                queries[key].forEach((value: any) => {
                    params.push(`${key}=${value}`);
                });
            }
        });
        params.sort();
        str += '\n' + params.join('\n');
    }
    return str;
};
