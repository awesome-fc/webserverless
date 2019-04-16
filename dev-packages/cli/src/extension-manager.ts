const find = require('find');

export interface Extension {
    name: string
    version: string
    frontends: string[]
    backends: string[]
}

export namespace Extension {
    export function generateDeps(extensions: Extension[]): string {
        return extensions.map(e => `"${e.name}": "${e.version}"`).join(',\n    ');
    }

    export function generateImports(extensions: Extension[], target: string, fn: 'import' | 'require'): string {
        let targetModules: string[] = [];
        for (const extension of extensions) {
            const current = (extension as any)[`${target}s`];
            targetModules = [...targetModules, ...current.map((m: string) => {
                const invocation = `${fn}('${extension.name}/${m}')`;
                if (fn === 'require') {
                    return `Promise.resolve(${invocation})`;
                }
                return invocation;
            })];
        }
        return targetModules.map(i => `then(function () { return ${i}.then(load) })`).join('.\n');
    }
}

export class ExtensionManager {

    collectExtension(): Promise<Extension[]> {
        const root = process.cwd();
        return new Promise((resolve, reject) => {
            find.file(/package.json/, root, (files: string[]) => {
                const extensions = [];
                for (const file of files) {
                    try {
                        const pkg = require(file);
                        if (pkg.webserverlessExtension) {
                            extensions.push({
                                name: pkg.name,
                                version: pkg.version,
                                frontends: pkg.webserverlessExtension.frontends || [],
                                backends: pkg.webserverlessExtension.backends || []
                            });
                        }
                    } catch (error) {

                    }

                }
                resolve(extensions)
            }).error((err: any) => {
                err && reject(err);
            });
        });
    }
}