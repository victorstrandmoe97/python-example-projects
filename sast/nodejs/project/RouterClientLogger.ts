import express from 'express';
export abstract class IRouterClientLogger {
    abstract logIncomingRequest(req: any, res: any, next: any): void;
}

export default class RouterClientLogger implements IRouterClientLogger{

    constructor() {}

    public logIncomingRequest(req: express.Request, _res: express.Response, next: express.NextFunction) {
        const isSignup = req.url.endsWith('/signup');
        console.info(`Incoming request: ${req.method} ${req.url}  user=${isSignup ? ``: req.headers['x-user-session']}`);
        next();
    }
}