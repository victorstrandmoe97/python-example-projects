import express from 'express';
import { AuthenticatedRequest } from '../RouterClientAuthentication';
import { DayOfWeek, DayTrainingSchedule } from '../api/UserRepository';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';
import { UserRepo } from '../..';
import JsonLogger from '../utils/JsonLogger';

export type PostGenerateScheduleDayRequest = AuthenticatedRequest & { body: PostGenerateScheduleDayRequestBody };
export type PostGenerateScheduleDayRequestBody = {
    current_day_schedule: DayTrainingSchedule;
    configuration: GenerateScheduleDayConfiguration;
}
export type PostGenerateScheduleResponse = express.Response;
export type PostGenerateScheduleResponseBody = {
    content: DayTrainingSchedule;
}

export type GenerateScheduleDayConfiguration = {
    day: DayOfWeek;
    duration: number;
    focus: string;
    area: string;
}

export default async function runPostGenerateDaySchedule(
    req: PostGenerateScheduleDayRequest,
    res: PostGenerateScheduleResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const newSchedule = await UserRepo.generateDaySchedule(
        req.headers["x-user-session"],
        req.body.configuration.day,
        req.body.current_day_schedule,
        req.body.configuration.focus,
        req.body.configuration.duration,
        req.body.configuration.area
    );

    if(!newSchedule) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to generate DAY schedule");
    }

    return HttpResponseUtils.sendSuccess<PostGenerateScheduleResponseBody>(res,
        {
            content: newSchedule
        });
}

function validateRequest(req: PostGenerateScheduleDayRequest): boolean {
    if(!req.body) {
        console.error("No request body");
        return false;
    }

    if(!req.body.current_day_schedule) {
        console.error("No day schedule");
        return false;
    }

    if(!req.body.configuration) {
        console.error("No configuration");
        return false;
    }

    if(!req.body.configuration.day) {
        console.error("No day");
        return false;
    }

    if(!req.body.configuration.duration) {
        console.error("No duration");
        return false;
    }

    JsonLogger.logObject(req.body.configuration, "Configuration")
    try {
        parseInt(req.body.configuration.duration);
    }
    catch(e) {
        console.error("Invalid duration");
        return false;
    }

    if(!req.body.configuration.focus) {
        console.error("No focus");
        return false;
    }

    if(!req.body.configuration.area) {
        console.error("No area");
        return false;
    }

    return true;
}