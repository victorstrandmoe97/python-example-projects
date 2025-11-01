import { APP_PORT } from "..";
import RouterClient from "./RouterClient";
import express from 'express';


export default class ServerClient {
    private _expressApp: any;
    private _routerClient: RouterClient;

    constructor() {
        this._expressApp = express();
        this._expressApp.use(express.json());
        this._expressApp.use(this.setupTextParser);

        //todo flagged for deletion
        this._expressApp.get('/', (_req: express.Request, _res: express.Response) => {});

        this._routerClient = new RouterClient();
        this.setupRouter();

    }

    public run(): void {    
        this._expressApp.listen(APP_PORT, () => {
            console.log(`Server listening on port ${APP_PORT}`)
        });
    }

    private setupRouter() {
        this._expressApp.use(this._routerClient.getExpressRouter());
    }

    private setupTextParser = (req:any, _res:any, next:any) => {
        let data = '';
        
        //@ts-ignore
        req.on('data', chunk => {
            data += chunk.toString();
        });

        req.on('end', () => {
            req.body = data;
            next();
        });
    }
}