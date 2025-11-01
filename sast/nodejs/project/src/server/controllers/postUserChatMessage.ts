import express from 'express';
// import GenerateNewExerciseInstructionsBuilder from '../ai/runs/GenerateNewExerciseInstructionsBuilder';
import { UserRepo } from '../..';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';

export type PostUserChatMessageRequest = express.Request  & { body: PostUserChatMessageRequestBody }
export type PostUserChatMessageRequestBody = {
    content: string;
    chat_thread_id: string;
}
export type PostUserChatMessageResponse = express.Response;
export type PostUserChatMessageResponseBody = {
    success: boolean;
}

export default async function runPostUserChatMessage(
    req: PostUserChatMessageRequest,
    res: PostUserChatMessageResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const messageResponse = await UserRepo.sendMessage(req.body.chat_thread_id, req.body.content);
    
    if(!messageResponse) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to send message");
    }

    return HttpResponseUtils.sendSuccess<PostUserChatMessageResponseBody>(res, 
        {
            success: messageResponse
        });

}

function validateRequest(req: PostUserChatMessageRequest): boolean {
    if(!req.body) {
        console.error("No request body");
        return false;
    }

    if(!req.body.chat_thread_id) {
        console.error("No chat id");
        return false;
    }
    if(!req.body.content || req.body.content.length === 0) {
        console.error("No content");
        return false;
    }

    if(req.body.content.length > 800) {
        console.error("Content too long");
        return false;
    }

    return true;
}