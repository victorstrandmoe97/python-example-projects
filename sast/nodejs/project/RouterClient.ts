import cors from 'cors';
import express from 'express';
import RouterClientAuthentication, { AuthenticatedRequest } from './RouterClientAuthentication';
import RouterClientLogger from './RouterClientLogger';
import runGetUserChatMessages, { GetUserChatMessagesRequest } from './controllers/getUserChatMessages';
import runGetUserSchedule, { GetUserScheduleRequest } from './controllers/getUserSchedule';
import runPostGenerateExercise, { PostGenerateExerciseRequest } from './controllers/postGenerateExercise';
import runPostGenerateSchedule, { PostGenerateScheduleRequest } from './controllers/postGenerateSchedule';
import runPostUserChatMessage, { PostUserChatMessageRequest, PostUserChatMessageResponse } from './controllers/postUserChatMessage';
import runSignup, { SignupRequest, SignupResponse } from './controllers/signup';
import HttpResponseUtils from './api/utils/HttpResponseUtils';
import runPostGenerateDaySchedule, { PostGenerateScheduleDayRequest } from './controllers/postGenerateDaySchedule';
import runPostGenerateHomeImage, { PostGenerateHomeImageRequest } from './controllers/postGenerateHomeImage';
import runPostFeedback, { PostFeedbackRequest } from './controllers/postFeedback';


//TODO Move validation for each route here from controllers
//TODO: Specify Request type for all routes: missing signup
export default class RouterClient {
    private _expressRouter: express.Router;
    private readonly _logger: RouterClientLogger;
    private readonly _authenticator: RouterClientAuthentication;
    
    constructor() {
        this._logger = new RouterClientLogger();
        this._authenticator = new RouterClientAuthentication();
        
        
        this._expressRouter = express.Router();
        this._expressRouter.use(cors({
            origin: true,
            credentials: false,
            methods: 'GET,POST',
            allowedHeaders: ['Content-Type','Authorization','x-user-session'],
        }));
        this._expressRouter.use(this._authenticator.handleIncomingRequest);
        this._expressRouter.use(this._logger.logIncomingRequest);
        this._expressRouter.post('/generate/schedule', this.handleRequest(this.postGenerateSchedule));
        this._expressRouter.post('/generate/schedule/day', this.handleRequest(this.postScheduleDay))
        this._expressRouter.post('/generate/image', this.handleRequest(this.postGenerateHomeImage))
        this._expressRouter.post('/generate/exercise', this.handleRequest(this.postGenerateExercise));
        this._expressRouter.post('/messages', this.handleRequest(this.postUserChatMessage));
        this._expressRouter.get('/messages', this.handleRequest(this.getUserChatMessages));
        this._expressRouter.get('/schedule', this.handleRequest(this.getUserSchedule));
        this._expressRouter.post('/signup', this.handleRequest(this.postSignup));
        this._expressRouter.post('/feedback', this.handleRequest(this.postFeedback))
    }
    private handleRequest<T extends AuthenticatedRequest>(controller: (req: T, res: express.Response) => void): express.RequestHandler {
        return (req, res) => {
            if (req.authReq) {
                try {

                    controller(req.authReq as T, res);
                }
                catch (e) {
                    console.error(e);
                    HttpResponseUtils.sendErrorInternal(res);
                }
            } else {
                HttpResponseUtils.sendErrorUnauthorized(res);
            }
        };
    }
    private postFeedback(req: PostFeedbackRequest, res: express.Response) {
        return runPostFeedback(req, res);
    }
    private postGenerateHomeImage(req: PostGenerateHomeImageRequest, res: express.Response) {
        return runPostGenerateHomeImage(req, res);
    }
    private postScheduleDay(req: PostGenerateScheduleDayRequest, res: express.Response) {
        return runPostGenerateDaySchedule(req, res);
    }
    private postSignup(req: SignupRequest, res: SignupResponse) {
        return runSignup(req, res);
    }
    private postGenerateSchedule(req: PostGenerateScheduleRequest, res: express.Response) {
        return runPostGenerateSchedule(req, res);
    }
    private postGenerateExercise(req: PostGenerateExerciseRequest, res: express.Response) {
        return runPostGenerateExercise(req, res);
    }
    private postUserChatMessage(req: PostUserChatMessageRequest, res: PostUserChatMessageResponse) {
        return runPostUserChatMessage(req, res);
    }
    private getUserSchedule(req: GetUserScheduleRequest, res: express.Response) {
        return runGetUserSchedule(req, res);
    }
    private getUserChatMessages(req: GetUserChatMessagesRequest, res: express.Response) {
        return runGetUserChatMessages(req, res);
    }
    public getExpressRouter(): express.Router {
        return this._expressRouter;
    }

    
}