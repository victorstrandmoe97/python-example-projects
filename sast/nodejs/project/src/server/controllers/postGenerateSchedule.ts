import express from 'express';
import { UserRepo } from '../..';
import { AuthenticatedRequest } from '../RouterClientAuthentication';
import { UserWeekTrainingSchedule } from '../api/UserRepository';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';

export type PostGenerateScheduleRequest = AuthenticatedRequest & { body: PostGenerateScheduleRequestBody };
export type PostGenerateScheduleRequestBody = {
    dog_name: string;
    dog_breed: string;
    dog_age: number;
    dog_age_units: 'months' | 'years';
    dog_social_level: string;
    dog_gender: string;
    dog_notes: string; 
    current_schedule: UserWeekTrainingSchedule;
}
export type PostGenerateScheduleResponse = express.Response;
export type PostGenerateScheduleResponseBody = {
    content: UserWeekTrainingSchedule;
}

export default async function runPostGenerateSchedule(
    req: PostGenerateScheduleRequest,
    res: PostGenerateScheduleResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const newSchedule = await UserRepo.generateNextWeekSchedule(
        req.headers["x-user-session"],
        req.body.current_schedule,
        req.body.dog_name,
        req.body.dog_breed,
        req.body.dog_age,
        req.body.dog_age_units,
        req.body.dog_social_level,
        req.body.dog_gender,
        req.body.dog_notes
    );
    if(!newSchedule) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to generate new schedule");
    }
    
    return HttpResponseUtils.sendSuccess<PostGenerateScheduleResponseBody>(res,
        {
            content: newSchedule
        });
}

function validateRequest(req: PostGenerateScheduleRequest): boolean {
    if(!req.body) {
        console.error("No request body");
        return false;
    }

    if(!req.body.dog_name) {
        console.error("No dog name");
        return false;
    }
    if(!req.body.dog_breed) {
        console.error("No dog breed");
        return false;
    }

    if(!req.body.dog_age) {
        console.error("No dog age");
        return false;
    }

    if(!req.body.dog_age_units) {
        console.error("No dog age units");
        return false;
    }

    if(!req.body.dog_social_level) {
        console.error("No dog social level");
        return false;
    }

    if(!req.body.dog_gender) {
        console.error("No dog gender");
        return false;
    }

    if(!req.body.current_schedule) {
        console.error("No current schedule");
        return false;
    }

    return true;
}