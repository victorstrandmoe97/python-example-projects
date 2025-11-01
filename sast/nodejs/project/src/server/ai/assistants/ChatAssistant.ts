import OpenAiApiClient from "../../api/OpenAiClient";
import { OpenAiMessage } from "../../api/interfaces/IOpenAiClient";
import RunSendMessageInstructionsBuilder from "../messages/RunSendMessageInstructiosBuilder";
import { Assistant } from "./Assistant.ts";
import UserThreadContextInstructionsBuilder from "./UserThreadContextInstructionsBuilder";

export default class ChatAssistant extends Assistant{

    constructor(api: OpenAiApiClient, assistantId: string) {
        super(api, assistantId);
    }

    public async sendChatMessage(threadId: string, textInput: string): Promise<true | null> { 
               
        const sendChatMessageRes = await this._api.sendUserMessage(threadId, textInput)
        if(sendChatMessageRes.error) {
            console.error(sendChatMessageRes.error);
            return null;
        }

        const createRun = await this._api.createRun(
                            this._assistantId, 
                            threadId,
                            new RunSendMessageInstructionsBuilder().addResponseFormat().addBounds().addImprovements().build());

        if(createRun.error) {
            console.error(createRun.error);
            return null;
        }

        console.log("Run: ",createRun.payload?.id ," -- Run status: " + createRun.payload?.status + "Thread: " + createRun.payload?.thread_id)

        const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));
        await timeout(1000);

        return true;
     }

     public async getChatMessages(threadId: string): Promise<OpenAiMessage[] | null>{
        const getChatRes = await this._api.getThreadMessages(threadId);
        if(!getChatRes.payload) {
            console.error(getChatRes.error?.message);
            return null;
        }

        return getChatRes.payload.data;

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
            .addChatInstructions()
            .addNotes(dogNotes)
            .build(); 

        const createChatRes = await this._api.createThreadAndRun(
                userInstructions,
                this._assistantId, 
                'chat',
                appUserSession,
            );

            if(!createChatRes.payload) {
                console.error(createChatRes.error?.message);
                return null;        
            }

            return createChatRes.payload.thread_id;
    }
    
}