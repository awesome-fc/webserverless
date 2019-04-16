import { Context } from './context';
import { Prioritizeable } from '../../common/prioritizeable';
import { injectable, multiInject, optional, inject } from 'inversify';
import { ResponseErrorLiteral, ErrorCodes, ResponseMessage } from 'vscode-jsonrpc/lib/messages';
import { ChannelManager } from './channel-manager';

export const ErrorHandler = Symbol('ErrorHandler');

export const DEFALUT_ERROR_HANDlER_PRIORITY = 500;

export interface ErrorHandler {
    readonly priority: number;
    canHandle(ctx: Context, err: Error): Promise<boolean>;
    handle(ctx: Context, err: Error): Promise<void>;
}

@injectable()
export abstract class AbstractErrorHandler implements ErrorHandler {
    readonly priority: number = DEFALUT_ERROR_HANDlER_PRIORITY;
    @inject(ChannelManager)
    protected readonly channelManager: ChannelManager;

    canHandle(ctx: Context, err: Error): Promise<boolean> {
        return Promise.resolve(true);
    }

    async handle(ctx: Context, err: Error): Promise<void> {
        const responseMessage = await this.getErrorRespanseMessage(ctx, err);
        try {
            const channel = await this.channelManager.getChannel(ctx);
            channel.send(JSON.stringify(responseMessage));
        } catch (error) {
            ctx.getCallback()(error, undefined);
        }
        await this.doHandle(ctx, err);
    }

    doHandle(ctx: Context, err: Error): Promise<void> {
        return Promise.resolve();
    }

    protected getErrorRespanseMessage(ctx: Context, err: Error): Promise<ResponseMessage> {
        const message = ctx.message;
        const responseMessage = <ResponseMessage>{
            id: JSON.parse(message.content).id,
            error: <ResponseErrorLiteral<Error>> {
                code: this.getErrorCode(),
                message: err.message,
                data: err
            }
        };
        return Promise.resolve(responseMessage);
    }

    protected getErrorCode(): number {
        return ErrorCodes.UnknownErrorCode;
    }
}

@injectable()
export class DefaultErrorHandler extends AbstractErrorHandler {
}

@injectable()
export class ErrorHandlerProvider {

    protected prioritized: ErrorHandler[];

    constructor(
        @multiInject(ErrorHandler) @optional()
        protected readonly handlers: ErrorHandler[]
    ) { }

    provide(): ErrorHandler[] {
        if (!this.prioritized) {
            this.prioritized = Prioritizeable.prioritizeAllSync(this.handlers).map(c => c.value);
        }
        return this.prioritized;
    }

}
