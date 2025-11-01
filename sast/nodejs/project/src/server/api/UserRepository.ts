import { DogAgeUnits, DogSocialLevelInput } from "../../types/dog";
import OpenAiTransformUtils from "../ai/OpenAiTransformUtils";
import ChatAssistant from "../ai/assistants/ChatAssistant";
import ExercisesAssistant from "../ai/assistants/ExercisesAssistant";
import ImageAssistant from "../ai/assistants/ImageAssistant";
import ScheduleAssistant, { TrainingDayArea, TrainingDayDuration, TrainingDayFocus } from "../ai/assistants/ScheduleAssistant";
import { UserChatMessage } from "../controllers/getUserChatMessages";
import { UserSavedExercise } from "../controllers/postGenerateExercise";
import { SignupResponseBody } from "../controllers/signup";
import { IRealtimeDatabaseRepository } from "../database/RealTimeDatabaseClient";
import { UserFeedbackEntry } from "../database/models/UserFeedbackEntry";
import JsonLogger from "../utils/JsonLogger";
import HttpResponseUtils from "./utils/HttpResponseUtils";


export default class UserRepository {
    constructor(
        private readonly scheduleAssistant: ScheduleAssistant,
        private readonly chatAssistant: ChatAssistant,
        private readonly exercisesAssistant: ExercisesAssistant,
        private readonly imageAssistant: ImageAssistant,
        private readonly database: IRealtimeDatabaseRepository
    ) {
    }

    public async addFeedback(
        appUserSession: string,
        schedule_thread_id: string,
        chat_thread_id: string,
        app_version?: string,
        improvementInput?: string,
        issueReportInput?: string,
        dog_name?: string,
        dog_breed?: string,
        dog_age?: number,
        dog_age_units?: DogAgeUnits,
        dog_gender?: string,
        dog_social_level?: DogSocialLevelInput,
    ): Promise<boolean> {
        try {

            const feedback: UserFeedbackEntry = {
                user_session_id: appUserSession,
                improvement_input: improvementInput,
                issue_report_input: issueReportInput,
                chat_thread_id: chat_thread_id,
                schedule_thread_id: schedule_thread_id,
                created_at: Date.now()
            };

            if(app_version) {
                feedback.app_version = app_version;
            }
            if(dog_name) {
                feedback.dog_name = dog_name;
                feedback.dog_breed = dog_breed;
                feedback.dog_age = dog_age;
                feedback.dog_age_units = dog_age_units;
                feedback.dog_gender = dog_gender;
                feedback.dog_social_level = dog_social_level;
            }
            await this.database.addUserFeedback(feedback);
            return true;
        }
        catch(e) {
            console.error(e);
            return false;
        }
    }
    public async generateHomeImage(
        appUserSession: string,
        dogName: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: DogAgeUnits,
        dogGender: string,
        dogSocialLevel: DogSocialLevelInput,
        _dogNotes: string
    ): Promise<string | null> {
        const assistantResponse = await this.imageAssistant.generateDogImage(
            appUserSession,
            dogName,
            dogGender,
            dogBreed,
            dogAge,
            dogAgeUnits,
            dogSocialLevel,
        );
        if(!assistantResponse) {
            return null;
        }

        return assistantResponse
    }

    public async getSchedule(threadId: string): Promise<UserWeekTrainingSchedule | null> {
       const assistantResponse = await this.scheduleAssistant.getSchedule(threadId); 

       if(assistantResponse) {
           return HttpResponseUtils.parseJson<UserWeekTrainingSchedule>(assistantResponse);
        }

        return null;
    }

    public async getMessages(threadId: string): Promise<UserChatMessage[] | null>{
        const assistantResponse = await this.chatAssistant.getChatMessages(threadId);
        if(!assistantResponse) {
            return null;
        }

        const messages: UserChatMessage[] = [];
        for(const message of assistantResponse) {
            if(message.content[0]) {
                messages.push(OpenAiTransformUtils.transformToUserMessage(message));
            }
        }

        return messages;

    }

    public async sendMessage(threadId: string, message: string): Promise<true | null> {
        const assistantResponse = await this.chatAssistant.sendChatMessage(threadId, message)
        if(!assistantResponse) {
            return null;
        }

        return true;
    }

    public async generateExercise(
        appUserSession: string,
        savedExercises: UserSavedExercise[],
        dogName: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: DogAgeUnits,
        dogGender: string,
        dogSocialLevel: DogSocialLevelInput,
        dogNotes: string,
    ): Promise<UserGeneratedExercise | null> {
        const assistantResponse = await this.exercisesAssistant.generateExercise(
            appUserSession,
            savedExercises,
            dogName,
            dogGender,
            dogBreed,
            dogAge,
            dogAgeUnits,
            dogSocialLevel,
            dogNotes
        );
        if(!assistantResponse) {
            console.error("Missing ai response")
            return null;
        }

        const responseAsObject = HttpResponseUtils.parseJson<UserGeneratedExercise>(assistantResponse);
        if(!responseAsObject) {
            console.error("Could not parse response as object", assistantResponse)
            return null;
        }

        if(!responseAsObject.content) {
            JsonLogger.logObject(responseAsObject, "No content found from parsed response");
            return null;
        }

        return responseAsObject
    }

    public async signup(
        appUserSession: string,
        dogName: string,
        dogGender: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: string,
        dogSocialLevel: string,
        dogNotes: string
    ): Promise<SignupResponseBody | null> {
        const schedule_thread_id = await
            this.scheduleAssistant.createThreadWithUserContext(
                appUserSession,
                dogName,
                dogGender,
                dogBreed,
                dogAge,
                dogAgeUnits,
                dogSocialLevel,
                dogNotes,
            );
        if(!schedule_thread_id) {
            return null;
        }

        const chat_thread_id = await
            this.chatAssistant.createThreadWithUserContext(
                appUserSession,
                dogName,
                dogGender,
                dogBreed,
                dogAge,
                dogAgeUnits,
                dogSocialLevel,
                dogNotes
            ); 
        if(!chat_thread_id) {
            return null;
        }

         
        return {
            schedule_thread_id: schedule_thread_id,
            chat_thread_id: chat_thread_id,
        };
    }

    public async generateNextWeekSchedule(
        appUserSession: string,
        currentSchedule: UserWeekTrainingSchedule,
        dogName: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: 'years' | 'months',
        dogSocialLevel: DogSocialLevelInput,
        dogGender: string,
        dogNotes: string
    ): Promise<UserWeekTrainingSchedule | null> {
        const currentScheduleAsString = JSON.stringify(currentSchedule);

        const assistantResponse = await this.scheduleAssistant.generateNextWeekSchedule(
                appUserSession,
                currentScheduleAsString,
                dogName,
                dogBreed,
                dogAge,
                dogAgeUnits,
                dogSocialLevel,
                dogGender,
                dogNotes
            );
        if(!assistantResponse) {
            return null;
        }

        const responseAsObject = HttpResponseUtils.parseJson<UserWeekTrainingSchedule>(assistantResponse);
        if(!responseAsObject) {
            console.error("Could not parse response as object", assistantResponse)
            return null;
        }

        return responseAsObject;
    }

    public async generateDaySchedule(
        appUserSession: string,
        day: DayOfWeek,
        currentDaySchedule: DayTrainingSchedule,
        focus: TrainingDayFocus,
        duration: TrainingDayDuration,
        area: TrainingDayArea
    ):Promise<DayTrainingSchedule | null>{
        const currentScheduleAsString = JSON.stringify(currentDaySchedule);

        const assistantResponse = await this.scheduleAssistant.generateDaySchedule(
            appUserSession,
            currentScheduleAsString,
            day,
            focus,
            duration,
            area
        );
        if(!assistantResponse) {
            return null;
        }

        const responseAsObject = HttpResponseUtils.parseJson<DayTrainingSchedule>(assistantResponse);
        if(!responseAsObject) {
            console.error("Could not parse response as object", assistantResponse)
            return null;
        }

        return responseAsObject;
    }
}


export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type DayTrainingSchedule = {
    "morning": string[],
    "evening": string[],
    "tip": string
    "dayOfWeek": DayOfWeek
}

export type UserWeekTrainingSchedule = {
    "monday": DayTrainingSchedule,
    "tuesday": DayTrainingSchedule,
    "wednesday": DayTrainingSchedule,
    "thursday": DayTrainingSchedule,
    "friday": DayTrainingSchedule,
    "saturday": DayTrainingSchedule,
    "sunday": DayTrainingSchedule,
}


export type UserGeneratedExercise = {
    content: string;
    tip: string;
    date: Date;
    title: string;
};