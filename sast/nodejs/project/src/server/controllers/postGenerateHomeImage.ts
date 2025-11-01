import express from 'express';
import { UserRepo } from '../..';
import { AuthenticatedRequest } from '../RouterClientAuthentication';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';

export type PostGenerateHomeImageRequest = AuthenticatedRequest & { body:  PostGenerateHomeImageRequestBody };
export type PostGenerateHomeImageRequestBody = {
    dog_name: string;
    dog_breed: string;
    dog_age: number;
    dog_age_units: 'months' | 'years';
    dog_social_level: string;
    dog_gender: string;
    dog_notes: string; 
}
export type PostGenerateHomeImageResponse = express.Response;
export type PostGenerateHomeImageResponseBody = {
    content: string;
}

export default async function runPostGenerateHomeImage(
    req: PostGenerateHomeImageRequest,
    res: PostGenerateHomeImageResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const newImage = await UserRepo.generateHomeImage(
        req.headers["x-user-session"],
        req.body.dog_name,
        req.body.dog_breed,
        req.body.dog_age,
        req.body.dog_age_units,
        req.body.dog_gender,
        req.body.dog_social_level,
        req.body.dog_notes
    );
    if(!newImage) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to generate new schedule");
    }
    
    return HttpResponseUtils.sendSuccess<PostGenerateHomeImageResponseBody>(res,
        {
            content: newImage
        });
}

function validateRequest(req: PostGenerateHomeImageRequest): boolean {
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

    return true;
}