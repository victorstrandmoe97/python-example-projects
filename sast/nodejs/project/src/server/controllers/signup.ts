import express from 'express';
import { UserRepo } from '../..';
import { DogSocialLevelInput } from '../../types/dog';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';
import { AuthenticatedRequest } from '../RouterClientAuthentication';

export type SignupRequest = AuthenticatedRequest & { body: SignupRequestBody };
export type SignupRequestBody = {
    dog_name: string;
    dog_breed: string;
    dog_age: number;
    dog_age_units: string;
    dog_gender: string;
    dog_social_level: DogSocialLevelInput;
    dog_notes: string;
}
export type SignupResponse = express.Response

;
export type SignupResponseBody = {
    schedule_thread_id: string;
    chat_thread_id: string;
}

export default async function runSignup(
    req: SignupRequest,
    res: SignupResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const signupRes = await UserRepo.signup(
        req.headers["x-user-session"],
        req.body.dog_name,
        req.body.dog_gender,
        req.body.dog_breed,
        req.body.dog_age,
        req.body.dog_age_units,
        req.body.dog_social_level,
        req.body.dog_notes
    )


    if(!signupRes) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to signup");
    }

    return HttpResponseUtils.sendSuccess<SignupResponseBody>(res, 
        { 
            schedule_thread_id: signupRes.schedule_thread_id,
            chat_thread_id: signupRes.chat_thread_id,
        }
    );
}

function validateRequest(req: SignupRequest): boolean {
    if(!req.body) {
        console.error("No request body");
        return false;
    }
    
    if(!req.body.dog_name) {
        console.error("No dog name")
        return false;
    }
    const regex = /^[a-zA-Z0-9 ]+$/;
    if(!regex.test(req.body.dog_name)) {
        console.error("Dog name contains invalid characters")
        return false;
    }
    if(!req.body.dog_breed) {
        console.error("No dog breed")
        return false;
    }
    if(!req.body.dog_age) {
        console.error("No dog age")
        return false;
    }
    if(!req.body.dog_age_units) {
        console.error("No dog age units")
        return false;
    }
    if(!req.body.dog_gender) {
        console.error("No dog gender")
        return false;
    }
    if(!req.body.dog_social_level) {
        console.error("No dog social level")
        return false;
    }
    return true;
}