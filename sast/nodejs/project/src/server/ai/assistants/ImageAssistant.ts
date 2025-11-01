import OpenAiApiClient from "../../api/OpenAiClient";
import RunGenerateHomeImageInstructionsBuilder from "../messages/RunGenerateHomeImageInstructionsBuilder";
import { Assistant } from "./Assistant.ts";

export default class ImageAssistant extends Assistant{

    constructor(api: OpenAiApiClient, assistantId: string) {
        super(api, assistantId);
    }

    public async generateDogImage(
        appUserSession: string,
        dogName: string,
        dogGender: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: string,
        dogSocialLevel: string,
    ): Promise<string | null> {
        const res = await this.createThreadWithUserContext(
            appUserSession,
            dogName,
            dogGender,
            dogBreed,
            dogAge,
            dogAgeUnits,
            dogSocialLevel,
        )

        return  res;
    }

    public async createThreadWithUserContext(
        appUserSession: string,
        _dogName: string,
        dogGender: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: string,
        _dogSocialLevel: string,
    ): Promise<string | null> {

        const createExercisesRes = await this._api.createImageCompletion(
            appUserSession,
           new RunGenerateHomeImageInstructionsBuilder()
           .addUserContext(dogGender, dogBreed, dogAge, dogAgeUnits)
           .addResponseFormat().build(),
        );
        
        if(!createExercisesRes) {
            console.error("No message from thread");
            return null;
        }
        if(!createExercisesRes.payload) {
            console.error(createExercisesRes.error?.message);
            return null;        
        }

        return createExercisesRes.payload.data[0].b64_json
    }
    
}