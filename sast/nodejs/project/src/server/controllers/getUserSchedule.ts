import express from 'express';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';
import { UserRepo } from '../..';
import { UserWeekTrainingSchedule } from '../api/UserRepository';
import { AuthenticatedRequest } from '../RouterClientAuthentication';

export type GetUserScheduleRequest = AuthenticatedRequest  & { query: GetUserScheduleRequestParams };
export type GetUserScheduleRequestParams = {
    schedule_thread_id: string;
}
export type GetUserScheduleResponse = express.Response;
export type GetUserScheduleResponseBody = {
    content: UserWeekTrainingSchedule;
}

export default async function runGetUserSchedule(
    req: GetUserScheduleRequest,
    res: GetUserScheduleResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

  
    const schedule = await UserRepo.getSchedule(req.query.schedule_thread_id);
    if(!schedule) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to get schedule");
    }

    return HttpResponseUtils.sendSuccess<GetUserScheduleResponseBody>(res, 
        {
            content: schedule
        
        });
}

function validateRequest(req: GetUserScheduleRequest): boolean {
    const requestBody = req.query;

    if(!requestBody) {
        console.error("No request body");
        return false;
    }

    if(!requestBody.schedule_thread_id) {
        console.error("No schedule id");
        return false;
    }

    return true;
}