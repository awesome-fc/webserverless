# Shared NPM script for webserverless packages.

`webserverlessext` is a command line tool to run shared npm scripts in webserverless packages. 

For instance, if you want add a new `hello` script that prints `Hello World`:

- add a new script to [package.json](./package.json) with the `ext:` prefix.

```json
{
    "name": "@webserverless/ext-scripts",
    "scripts": {
        "ext:hello": "echo 'Hello World'"
    }
}
```

- install `webserverlessext` in your package (the actual version can be different)

```json
{
    "name": "@webserverless/myextension",
    "devDependencies": {
        "@webserverless/ext-scripts": "^0.1.1"
    }
}
```

- you should be able to call `hello` script in the context of your package:

```shell
    npx webserverlessext hello
````

- and from npm scripts of your package:

```json
{
    "name": "@webserverless/myextension",
    "scripts": {
        "hello": "webserverlessext hello"
    }
}
```
