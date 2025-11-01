import OpenAiApiClient from "../../api/OpenAiClient";
import { OpenAiMessage, OpenAiRun } from "../../api/interfaces/IOpenAiClient";

export abstract class IAssistant {
    constructor(
        protected readonly _api: OpenAiApiClient,
        protected readonly _assistantId: string
    ) {
    }
    protected abstract watchForResponse(threadId: string, runId: string): Promise<OpenAiMessage | null>;
    protected abstract hasResponded(message: OpenAiMessage | null, run: OpenAiRun): boolean;
    protected abstract createThreadWithUserContext(
        appUserSession: string,
        dogName: string,
        dogGender: string,
        dogBreed: string,
        dogAge: number,
        dogAgeUnits: string,
        dogSocialLevel: string,
        dogNotes: string
    ): Promise<string | null>;

}