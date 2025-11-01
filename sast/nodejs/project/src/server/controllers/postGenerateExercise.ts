import express from 'express';
import { UserRepo } from '../..';
import { AuthenticatedRequest } from '../RouterClientAuthentication';
import { UserGeneratedExercise } from '../api/UserRepository';
import HttpResponseUtils from '../api/utils/HttpResponseUtils';

export type PostGenerateExerciseRequest = AuthenticatedRequest & { body: PostGenerateExerciseRequestBody };;
export type PostGenerateExerciseRequestBody = {
    saved_exercises: UserSavedExercise[];
    dog_name: string;
    dog_breed: string;
    dog_age: number;
    dog_age_units: string;
    dog_social_level: string;
}
export type PostGenerateExerciseResponse = express.Response;
export type PostGenerateExerciseResponseBody = UserGeneratedExercise;

export type UserSavedExercise = {
    content: string;
}

export default async function runPostGenerateExercise(
    req: PostGenerateExerciseRequest,
    res: PostGenerateExerciseResponse
) {
    const valid = validateRequest(req);
    if(!valid) {
        return HttpResponseUtils.sendErrorBadRequest(res);
    }

    const exercise = await UserRepo.generateExercise(
        req.headers["x-user-session"],
        req.body.saved_exercises,
        req.body.dog_name,
        req.body.dog_breed,
        req.body.dog_age,
        req.body.dog_age_units,
        req.body.dog_gender,
        req.body.dog_social_level,
        req.body.dog_notes
    );


    if(!exercise) {
        return HttpResponseUtils.sendErrorInternal(res, "Failed to generate exercise");
    }

    return HttpResponseUtils.sendSuccess<PostGenerateExerciseResponseBody>(res,exercise);
}

function validateRequest(req: PostGenerateExerciseRequest): boolean {
    const requestBody = req.body as PostGenerateExerciseRequestBody;

    if(!requestBody) {
        console.error("No request body");
        return false;
    }

    if(!requestBody.saved_exercises) {
        console.error("No saved_exercises id");
        return false;
    }

    if(!requestBody.dog_name) {
        console.error("No dog_name");
        return false;
    }
    if(!requestBody.dog_breed) {
        console.error("No dog_breed");
        return false;
    }
    if(!requestBody.dog_age) {
        console.error("No dog_age");
        return false;
    }
    if(!requestBody.dog_age_units) {
        console.error("No dog_age_units");
        return false;
    }
    if(!requestBody.dog_social_level) {
        console.error("No dog_social_level");
        return false;
    }


    return true;
}