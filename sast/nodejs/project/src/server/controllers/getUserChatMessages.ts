import express from 'express';
import { UserRepo } from '../..';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';
import { AuthenticatedRequest } from '../RouterClientAuthentication';

export type GetUserChatMessagesRequest = AuthenticatedRequest  & { query: GetUserChatMessagesRequestParams };
export type GetUserChatMessagesRequestParams = {
    chat_thread_id: string;
}
export type GetUserChatMessagesResponse = express.Response;
export type GetUserChatMessageResponseBody = {
    messages: UserChatMessage[];
}

export type UserChatMessage = {
    message: string;
    sender: 'user' | 'buddy';
    timestamp: number;
}

export default async function runGetUserChatMessages(
    req: GetUserChatMessagesRequest,
    res: GetUserChatMessagesResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const messages = await UserRepo.getMessages(req.query.chat_thread_id);

    if(!messages) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to get messages");
    }


    return HttpResponseUtils.sendSuccess<GetUserChatMessageResponseBody>(res, 
        {
            messages
        });
}

function validateRequest(req: GetUserChatMessagesRequest): boolean {
    const requestQuery = req.query as GetUserChatMessagesRequestParams;

    if(!requestQuery) {
        console.error("No request body");
        return false;
    }

    if(!requestQuery.chat_thread_id) {
        console.error("No schedule id");
        return false;
    }

    return true;
}