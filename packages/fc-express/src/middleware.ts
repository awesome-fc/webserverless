import { EVENT_HEADER_NAME, CONTEXT_HEADER_NAME } from './proxy-protocol';

export function eventContext(options?: { reqPropKey?: string, deleteHeaders?: boolean }) {
    return (req: any, res: any, next: any) => {
        const defaultOptions = { reqPropKey: 'eventContext', deleteHeaders: true };
        const { reqPropKey, deleteHeaders } = { ...defaultOptions, ...options };
        const eventStr = req.headers[EVENT_HEADER_NAME];
        const contextStr = req.headers[CONTEXT_HEADER_NAME];

        if (!contextStr) {
            console.error(`Missing ${CONTEXT_HEADER_NAME} header(s)`);
            next();
            return;
        }
        req[reqPropKey] = {
            context: JSON.parse(decodeURIComponent(contextStr))
        };

        if (req.headers[EVENT_HEADER_NAME]) {
            req[reqPropKey].event = JSON.parse(decodeURIComponent(eventStr));
        }

        if (deleteHeaders) {
            delete req.headers[EVENT_HEADER_NAME];
            delete req.headers[CONTEXT_HEADER_NAME];
        }

        next();
    };
}
