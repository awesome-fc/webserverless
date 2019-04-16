import { Middleware, Context } from '@webserverless/core/lib/node';
import { verify, JsonWebTokenError } from 'jsonwebtoken';
import { injectable, inject } from 'inversify';
import { ConfigProvider } from '@webserverless/core/lib/common/config-provider';

export const TOKEN_DECODED = 'tokenDecoded';

export const JWT_SECRET_OR_PUBLIC_KEY = 'to.jwt.secretOrPublicKey';

@injectable()
export class JWTMiddleWare implements Middleware {

    @inject(ConfigProvider)
    protected readonly configProvider: ConfigProvider;

    async handle(ctx: Context, next: () => Promise<void>): Promise<void> {
        const token = ctx.message.token;
        if (token) {
            Context.setAttr(TOKEN_DECODED, verify(token, await this.configProvider.get<string>(JWT_SECRET_OR_PUBLIC_KEY, '123456')));
        } else {
            throw new JsonWebTokenError('Token is required.');
        }
        await next();
    }

    readonly priority: number = 1000;

}
