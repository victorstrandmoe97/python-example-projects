import express from 'express';
import HttpResponseUtils from "./api/utils/HttpResponseUtils";
import HttpRequestUtils from './api/utils/HttpRequestUtils';

//TODO: adjust global to set headers usersessionx is string and not string[]
declare global {
    namespace Express {
        interface Request {
            authReq?:  AuthenticatedRequest;
        }
        interface Response {
            sendEncrypted: (data: any) => void;
        }
    }
}

export type AuthenticatedRequest = express.Request & { headers: express.Request['headers'] & { "x-user-session": string } };
export abstract class IRouterClientAuthentication {
    abstract handleIncomingRequest(req: any, res: any, next: any): void; //todo fix types
}

export default class RouterClientAuthentication  implements IRouterClientAuthentication{
    constructor(){}
  

    //todo refactor and move to dedicated functions
    public handleIncomingRequest(req: express.Request, res: express.Response, next: express.NextFunction) {        
        const userSession = HttpRequestUtils.unscrambleSessionHeader(req.headers["x-user-session"]);

        if(!userSession) {
            return HttpResponseUtils.sendErrorUnauthorized(res);
        }


        req.headers["x-user-session"] = userSession;

        if(req.method === 'POST') {
            const payload = HttpRequestUtils.decrypt(
                req.body,
                req.headers["x-user-session"] as string
            );

            if(!payload) {
                return HttpResponseUtils.sendErrorUnauthorized(res);
            }

            try {
                req.body = JSON.parse(payload);
            }
            catch(e) {
                console.error("Error parsing payload", e);
                return HttpResponseUtils.sendErrorBadRequest(res);
            }
        }

        const originalSend = res.send;
        res.sendEncrypted = (data: any) => {
            if (typeof data === 'object') {
                data = JSON.stringify(data);
            }
            const encryptedData = HttpResponseUtils.encrypt(data, req.headers["x-user-session"] as string);
            originalSend.call(res, encryptedData);
        };

        req.authReq = req as AuthenticatedRequest;
        next();
    }
}