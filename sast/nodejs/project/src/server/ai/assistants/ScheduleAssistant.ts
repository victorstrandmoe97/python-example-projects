import { DogSocialLevelInput } from "../../../types/dog";
import OpenAiApiClient from "../../api/OpenAiClient";
import { DayOfWeek } from "../../api/UserRepository";
import GenerateDayScheduleInstructionsBuilder from "../threads/GenerateDayScheduleInstructionsBuilder";
import GenerateWeeklyScheduleInstructionsBuilder from "../threads/GenerateWeeklyScheduleInstructionsBuilder";
import { Assistant } from "./Assistant.ts";
import UserThreadContextInstructionsBuilder from "./UserThreadContextInstructionsBuilder";

export default class ScheduleAssistant extends Assistant{

    constructor(_api: OpenAiApiClient, _assistantId: string) {
        super(_api, _assistantId);
    }

    public async getSchedule(threadId: string): Promise<string | null> {
        const  messagesRes = await this._api.getThreadMessages(threadId); 

        if(messagesRes.error) {
            console.error(messagesRes.error)
            return null;
        }
 
        if(!messagesRes.payload?.data) {
            console.error("No messages payload");
            return null;
         }

        if(messagesRes.payload.data.length < 2) {
            console.error("No schedule from thread")
            return null;
        }

        return messagesRes.payload.data[0].content[0].text.value;
     }

    
    public async generateDaySchedule(
        appUserSession: string,
        existingDaySchedule: string,
        dayOfWeek: DayOfWeek,
        focus: TrainingDayFocus,
        duration: string,
        area: TrainingDayArea
    ): Promise<string | null> {

        const createRunRes = await this._api.createThreadAndRun(
            '', //TODO FIX
            this._assistantId,
            'day-schedule',
            appUserSession,
            new GenerateDayScheduleInstructionsBuilder()
                .addSpecifications(dayOfWeek, focus, duration, area)
                .addExistingSchedule(existingDaySchedule)
                .addExamples()
                .addTip()
                .addResponseFormat()
                .build(),
        )
        if(!createRunRes.payload) {
            console.error(createRunRes.error);
            return null;
        }

        const aiResponse = await this.watchForResponse(createRunRes.payload.thread_id, createRunRes.payload.id);
        if(!aiResponse) {
            console.error("No message from thread run " + createRunRes.payload.id);
            return null;
        }

        return aiResponse.content[0].text.value;
    }

    public async generateNextWeekSchedule(
        appUserSession: string,
        existingSchedule: string,
        dogName: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: 'years' | 'months',
        dogSocialLevel: DogSocialLevelInput,
        dogGender: string,
        dogNotes: string,
    ): Promise<string | null> {
        const userInstructions = new UserThreadContextInstructionsBuilder()
            .addName(dogName)
            .addDescription(dogGender, dogBreed, dogAge, dogAgeUnits)
            .addSocialLevel(dogSocialLevel)
            .addNotes(dogNotes)
            .build(); 

        const createRunRes  = await this._api.createThreadAndRun(
            userInstructions,
            this._assistantId,
            'next-schedule',
            appUserSession,
            new GenerateWeeklyScheduleInstructionsBuilder()
                .addDateRange()
                .addSpecifications()
                .addExistingSchedule(existingSchedule)
                .addResponseFormat()
                .build(),
        );
        if(!createRunRes.payload) {
            console.error(createRunRes.error);
            return null;
        }

        const aiResponse = await this.watchForResponse(createRunRes.payload.thread_id, createRunRes.payload.id);
        if(!aiResponse) {
            console.error("No message from thread run " + createRunRes.payload.id);
            return null;
        }

        return aiResponse.content[0].text.value;
    }


    public async createThreadWithUserContext(
        appUserSession: string,
        dogName: string,
        dogGender: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: string,
        dogSocialLevel: string,
        dogNotes: string
    ): Promise<string | null> {
        const userInstructions = new UserThreadContextInstructionsBuilder()
                .addName(dogName)
                .addDescription(dogGender, dogBreed, dogAge, dogAgeUnits)
                .addSocialLevel(dogSocialLevel)
                .addNotes(dogNotes)
                .build(); 

        const createScheduleRes = await this._api.createThreadAndRun(
                userInstructions,
                this._assistantId,
                'schedule',
                appUserSession,     
                new GenerateWeeklyScheduleInstructionsBuilder()
                .addDateRange()
                .addSpecifications()
                .addResponseFormat()
                .build(),
            );

        if(!createScheduleRes.payload) {
            console.error(createScheduleRes.error?.message);
            return null;
        }

        
        const aiResponse = await this.watchForResponse(createScheduleRes.payload.thread_id, createScheduleRes.payload.id);
        if(!aiResponse) {
            console.error("No message from thread run " + createScheduleRes.payload.id);
            return null;
        } 

        return createScheduleRes.payload.thread_id;
    }

}

export type TrainingDayDuration = 
'5' |
'10' |
'15' |
'30' | 
'45' |
'60' 


export type TrainingDayArea = 
'Home' |
'Park' |
'Beach' |
'Forest' |
'City' |
'Dog park' |
'Training facility'

export type TrainingDayFocus =
'dog-dog reactivity' | 
'dog-human reactivity' |
'competitive agility' |
'basic commands' |
'Boundary control' |
'barking control' |
'Barking control' |
'Leash training';