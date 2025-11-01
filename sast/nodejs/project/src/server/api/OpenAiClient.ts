import HttpClient, { ApiResponse, FetchOptions } from "./HttpClient";
import { CreateRunFetchOptionsBody, IOpenAiClient, OpenAiImageGeneration, OpenAiListResponse, OpenAiMessage, OpenAiRun, SendUserMessageFetchOptionsBody } from "./interfaces/IOpenAiClient";
import { CreateProfilePicAssistantFunction, OpenAiAssistant, UserThreadTypes } from "./types";

export default class OpenAiApiClient extends HttpClient implements IOpenAiClient {

    constructor(
        private readonly _apiKey: string,
        private readonly _apiVersion: string,
        private readonly _apiUrl: string
    ) {
        super();
    }

    protected async fetch<T>(options: FetchOptions): Promise<ApiResponse<T>> {
        return super.fetch<T>(options);
    }
    
    private createThreadAndRunFetchOptions(body: any): FetchOptions {
        return HttpClient.fetchOptions(
           `${this._apiUrl}/${this._apiVersion}/threads/runs`,
            this._apiKey,
            'POST',
            {
                'OpenAI-Beta': 'assistants=v2',
            },
            JSON.stringify(body),
        );
    
    }

    private createImageCompletionFetchOptions(body: any): FetchOptions {
        return HttpClient.fetchOptions(
           `${this._apiUrl}/${this._apiVersion}/images/generations`,
            this._apiKey,
            'POST',
            {
                'OpenAI-Beta': 'assistants=v2',
            },
            JSON.stringify(body),
        );
    
    }
    // {
    //   "id": "run_qJL1kI9xxWlfE0z1yfL0fGg9",
    //   ...
    //   "status": "requires_action",
    //   "required_action": {
    //     "submit_tool_outputs": {
    //       "tool_calls": [
    //         {
    //           "id": "call_FthC9qRpsL5kBpwwyw6c7j4k",
    //           "function": {
    //             "arguments": "{"location": "San Francisco, CA"}",
    //             "name": "get_rain_probability"
    //           },
    //           "type": "function"
    //         },
    //         {
    //           "id": "call_RpEDoB8O0FTL9JoKTuCVFOyR",
    //           "function": {
    //             "arguments": "{"location": "San Francisco, CA", "unit": "Fahrenheit"}",
    //             "name": "get_current_temperature"
    //           },
    //           "type": "function"
    //         }
    //       ]
    //     },
    //     ...
    //     "type": "submit_tool_outputs"
    //   }
    // }


// "tools": [
//   {
//     "type": "function",
//     "function": {
//       "name": "get_current_weather",
//       "description": "Get the current weather in a given location",
//       "parameters": {
//         "type": "object",
//         "properties": {
//           "location": {
//             "type": "string",
//             "description": "The city and state, e.g. San Francisco, CA"
//           },
//           "unit": {
//             "type": "string",
//             "enum": ["celsius", "fahrenheit"]
//           }
//         },
//         "required": ["location"]
//       }
//     }
//   }
// ],

    public async createThreadAndRun(
        instructions: string,
        assistantId: string,
        type: UserThreadTypes,
        appUserSession: string,
        initialMessage?: string,
        tool?: CreateProfilePicAssistantFunction
    ): Promise<ApiResponse<OpenAiRun>> {
        const runInitialMessage =  initialMessage ? { 
            content: initialMessage,
            role: "user"
        } : undefined;
        return this.fetch<OpenAiRun>(this.createThreadAndRunFetchOptions(
           {
                instructions,
                assistant_id: assistantId,
                thread: {
                    messages: runInitialMessage ? [runInitialMessage] : [],
                    metadata: {
                        thread_type: type,
                        app_user_session: appUserSession.substring(0, 512)
                    }
                },
                tools: tool ? [tool] : undefined
           }
        ));
    }
    
    
    public async createImageCompletion(
        userSessionId: string,
        instructions: string,
    ): Promise<ApiResponse<OpenAiImageGeneration>> {
        return this.fetch<OpenAiImageGeneration>(this.createImageCompletionFetchOptions(
           {
                "model": "dall-e-3",
                "prompt": instructions,
                "n": 1,
                "size": "1024x1024",
                "response_format": "b64_json",
                "user": userSessionId
           }
        ));
    }

    private getAssistantFetchOptions(assistantId: string): FetchOptions {
        return HttpClient.fetchOptions(
           `${this._apiUrl}/${this._apiVersion}/assistants/${assistantId}`,
            this._apiKey,
            'GET',
            {
                'OpenAI-Beta': 'assistants=v2',
            }
        );
    }

    public async getAssistant(assistantId: string): Promise<ApiResponse<OpenAiAssistant>> {
        return this.fetch<OpenAiAssistant>
                        (this.getAssistantFetchOptions(assistantId));
    }

    private sendUserMessageFetchOptions(body: SendUserMessageFetchOptionsBody, threadId: string): FetchOptions {
        return HttpClient.fetchOptions(
           `${this._apiUrl}/${this._apiVersion}/threads/${threadId}/messages`,
            this._apiKey,
            'POST',
            {
                'OpenAI-Beta': 'assistants=v2',
            },
            JSON.stringify(body)
        );
    
    }

    public async sendUserMessage(threadId: string, message: string): Promise<ApiResponse<OpenAiMessage>> {
        return this.fetch<OpenAiMessage>
                    (this.sendUserMessageFetchOptions({content: message, role: "user"}, threadId));
    }

    private getThreadMessagesFetchOptions(threadId: string): FetchOptions {
        return HttpClient.fetchOptions(
            `${this._apiUrl}/${this._apiVersion}/threads/${threadId}/messages`,
            this._apiKey,
            'GET',
            {
                'OpenAI-Beta': 'assistants=v2',
            });
    }
    
    public async getThreadMessages(threadId: string): Promise<ApiResponse<OpenAiListResponse<OpenAiMessage>>> {
        return this.fetch<OpenAiListResponse<OpenAiMessage>>
                        (this.getThreadMessagesFetchOptions(threadId));
    }

    private getThreadRunFetchOptions(threadId: string, runId: string): FetchOptions {
        return HttpClient.fetchOptions(
           `${this._apiUrl}/${this._apiVersion}/threads/${threadId}/runs/${runId}`,
            this._apiKey,
            'GET',
            {
                'OpenAI-Beta': 'assistants=v2',
            }
        );
    }

    public async getThreadRun(threadId: string, runId: string): Promise<ApiResponse<OpenAiRun>> {
        return this.fetch<OpenAiRun>(this.getThreadRunFetchOptions(threadId, runId));
    }

    private createRunFetchOptions(threadId: string, body: CreateRunFetchOptionsBody): FetchOptions {
        return HttpClient.fetchOptions(
              `${this._apiUrl}/${this._apiVersion}/threads/${threadId}/runs`,
                this._apiKey,
                'POST',
                {
                 'OpenAI-Beta': 'assistants=v2',
                },
                JSON.stringify(body),
          );
    }

    public async createRun(assistantId: string, threadId: string, instructions?: string): Promise<ApiResponse<OpenAiRun>> {
        return this.fetch<OpenAiRun>(this.createRunFetchOptions(
            threadId,
            {
                assistant_id: assistantId,
                additional_instructions: instructions ?? undefined,
            })
        );
    }

    private cancelRunFetchOptions(threadId: string, runId: string): FetchOptions {
        return HttpClient.fetchOptions(
           `${this._apiUrl}/${this._apiVersion}/threads/${threadId}/runs/${runId}/cancel`,
            this._apiKey,
            'POST',
            {
                'OpenAI-Beta': 'assistants=v2',
            }
        );
    }
    public async cancelRun(threadId: string, runId: string): Promise<ApiResponse<OpenAiRun>> {
        return this.fetch<OpenAiRun>(this.cancelRunFetchOptions(threadId, runId));
    }

}