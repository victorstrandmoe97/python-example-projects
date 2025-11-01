import OpenAiApiClient from "../../api/OpenAiClient";
import { UserSavedExercise } from "../../controllers/postGenerateExercise";
import GenerateExerciseInstructionsBuilder from "../runs/GenerateExerciseInstructionsBuilder";
import { Assistant } from "./Assistant.ts";
import UserThreadContextInstructionsBuilder from "./UserThreadContextInstructionsBuilder";

export default class ExercisesAssistant extends Assistant {

    constructor(api: OpenAiApiClient, assistantId: string) {
        super(api, assistantId);
    }

    public async generateExercise(
        appUserSession: string,
        savedExercises: UserSavedExercise[],
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
    
        const createThreadAndRunRes = await this._api.createThreadAndRun(
            userInstructions,
            this._assistantId,
            'exercises',
            appUserSession,
            new GenerateExerciseInstructionsBuilder()
                .addTip()
                .addSavedExercises(savedExercises)
                .addResponseFormat()
                .build(),
        )
        if(createThreadAndRunRes.error) {
            console.error(createThreadAndRunRes.error);
            return null;
        }

        if(!createThreadAndRunRes.payload) {
            console.error("No payload");
            return null;
        }
        
        const aiResponse = await this.watchForResponse(
                    createThreadAndRunRes.payload.thread_id,
                    createThreadAndRunRes.payload.id
                );

        if(!aiResponse) {
            console.error("No message from thread");
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

        const createExercisesRes = await this._api.createThreadAndRun(
            userInstructions,
            this._assistantId, 
            'exercises',
            appUserSession,
            new GenerateExerciseInstructionsBuilder()
                .addTip()
                .addResponseFormat()
                .build(),
        );
        
        if(!createExercisesRes.payload) {
            console.error(createExercisesRes.error?.message);
            return null;        
        }

        return createExercisesRes.payload.thread_id;

    }



}

