import express from 'express';
import { UserRepo } from "../..";
import { AuthenticatedRequest } from "../RouterClientAuthentication";
import HttpResponseUtils from "../api/utils/HttpResponseUtils";

export type PostFeedbackRequest = AuthenticatedRequest  & { query: PostFeedbackRequestParams };
export type PostFeedbackRequestParams = {
    chat_thread_id: string;
    schedule_thread_id: string;
    app_version: string;
    report_issue_input?: string;
    improvement_input?: string;
}
export type PostFeedbackResponse = express.Response;
export type PostFeedbackResponseBody = {
    success: boolean;
}

export default async function runPostFeedback(
    req: PostFeedbackRequest,
    res: PostFeedbackResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const feedbackAdded = await UserRepo.addFeedback(
        req.headers["x-user-session"],
        req.body.chat_thread_id,
        req.body.schedule_thread_id,
        req.body.app_version,
        req.body.improvement_input,
        req.body.report_issue_input,
        req.body.dog_name,
        req.body.dog_breed,
        req.body.dog_age,
        req.body.dog_age_units,
        req.body.dog_gender,
        req.body.dog_social_level,
        );

    if(!feedbackAdded) {
        console.error("Error adding feedback");
        return HttpResponseUtils.sendErrorInternal(res);
    }
    
    console.log("Feedback added");
    return HttpResponseUtils.sendSuccess<PostFeedbackResponseBody>(res, { success: feedbackAdded });
}

function validateRequest(req: PostFeedbackRequest): boolean {
    const requestQuery = req.body as PostFeedbackRequestParams;

    if(!requestQuery) {
        console.error("No request body");
        return false;
    }


    if(!requestQuery.improvement_input && !requestQuery.report_issue_input) {
        console.error("No feedback input");
        return false;
    }

    if(!requestQuery.chat_thread_id) {
        console.error("No chat id");
        return false;
    }
    if(!requestQuery.schedule_thread_id) {
        console.error("No schedule id");
        return false
    }
    return true;
}