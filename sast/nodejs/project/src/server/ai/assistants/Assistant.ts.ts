import { AI_RESPONSE_INITIAL_DELAY, AI_RESPONSE_MAX_RETRY_COUNT, AI_RESPONSE_POLLING_INTERVAL } from "../../..";
import OpenAiApiClient from "../../api/OpenAiClient";
import { OpenAiMessage } from "../../api/interfaces/IOpenAiClient";
import { IAssistant } from "./IAssistant";

export abstract class Assistant extends IAssistant{
    constructor(_api: OpenAiApiClient, ASSISTANT_ID: string) {
        super(_api, ASSISTANT_ID);
    }
    
    protected hasResponded(message: OpenAiMessage | null): boolean {
        if(!message) {
            return false;
        }

        if(message.content.length === 0) {
            return false;
        }
        
        if(message.role === 'assistant' && message.content[0].text.value === '') {
            return false;
        }

        if(message.role === 'user') {
            return false;
        }

        return true;
    }

    protected async watchForResponse(threadId: string, runId: string): Promise<OpenAiMessage | null> {
        let aiResponse: OpenAiMessage | null = null;
        let retryCount = 0;
        
        const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));
        await timeout(AI_RESPONSE_INITIAL_DELAY);
        
        while(retryCount < AI_RESPONSE_MAX_RETRY_COUNT) {
            let runRes = await this._api.getThreadRun(threadId, runId);
            if(!runRes.payload) {
                console.error("Failed to contact OpenAiApi", runRes.error?.message);
                retryCount++;
                continue;
            }
            
            console.log("Run: ", runRes.payload?.id ," -- Run status: " + runRes.payload?.status + " -- Thread: " + runRes.payload?.thread_id + " -- Polling count: " + retryCount)
            
            const messagesRes = await this._api.getThreadMessages(threadId);
            if(!messagesRes.payload) {
                console.error("Failed to contact OpenAiApi", messagesRes.error?.message);
                retryCount++;
                continue;
            }

            const lastThreadMessage = messagesRes.payload.data[0];
            const secondLastThreadMessage = messagesRes.payload.data[1];

            if(this.hasResponded(lastThreadMessage)) {
                aiResponse = lastThreadMessage;
                break;
            }

            if(this.hasResponded(secondLastThreadMessage)) {
                aiResponse = secondLastThreadMessage;
                await this._api.cancelRun(threadId, runId);
                break;
            }

     
            if(
                runRes.payload.status !== 'queued' &&
                runRes.payload.status !== 'in_progress' && 
                runRes.payload.status !== 'completed'
            ) {
                console.error("Error in Run. Exiting:", runRes.payload.last_error)
                break;
            }
         
            retryCount++;
            await timeout(AI_RESPONSE_POLLING_INTERVAL);
        }

        return aiResponse;

    }
}