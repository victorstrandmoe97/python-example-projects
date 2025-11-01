import { ApiResponse, FetchOptions } from "../HttpClient";
import { CreateProfilePicAssistantFunction, OpenAiModelType, OpenAiTool, UserThreadTypes } from "../types";

export type CreateAssistantFetchOptions = FetchOptions & {
    body: CreateAssistantFetchOptionsBody
}
export type CreateAssistantFetchOptionsBody = {
        instructions: string;
        name: string;
        tools: OpenAiTool[];
        model: OpenAiModelType;
};

export type OpenAiThreadMessage = {
    role: string;
    content: string;
  };
  
  type OpenAiThread = {
    messages: OpenAiThreadMessage[];
    metadata?: Record<string, any>;
  };
  
export type CreateThreadAndRunFetchOptionsBody = {
    assistant_id: string;
    thread: OpenAiThread;
    instructions: string;
    tools?: CreateProfilePicAssistantFunction[];
  };

  export type SendUserMessageFetchOptionsBody = {
    content: string;
    role: OpenAiRole;
  }
  export type OpenAiImageGeneration = {
    created: number,
    data: {'b64_json': string}[],
  }
 export type OpenAiRun = {
    id: string;
    object: string;
    created_at: number;
    assistant_id: string;
    thread_id: string;
    status: OpenAiRunStatus;
    started_at: number;
    expires_at: null | number;
    cancelled_at: null | number;
    failed_at: null | number;
    completed_at: number;
    last_error: null | any;
    model: string;
    instructions: null | string;
    tools: OpenAiTool[]; 
    file_ids: string[];
    metadata: Record<string, any>;
  };
  
export type OpenAiRunStatus = "in_progress" | "cancelled" | "failed" | "completed" | "expired" | "queued" | "requires_action" | "cancelling";
export type OpenAiRole = "user" | "assistant" | "system";
export type OpenAiMessage =  {
    id: string;
    object: string;
    created_at: number;
    thread_id: string;
    role: OpenAiRole;
    content: MessageContent[];
    file_ids: string[];
    assistant_id: null | string;
    run_id: null | string;
    metadata: Record<string, any>;
  };
  
  type MessageContent = {
    type: string;
    text: {
      value: string;
      annotations: any[];
    };
  };

  export type OpenAiListResponse<T> = {
    data: T[];
    object: 'list';
    first_id: string;
    last_id: string;
    has_more: boolean;
}
export type OpenAiApiErrorResponse = {
    error : {
        message: string;
        type: string;
        param: string;
        code: string;
    }
}

export type CreateRunFetchOptionsBody = {
    assistant_id: string;
    additional_instructions?: string;
}
  

export abstract class IOpenAiClient {
    public abstract createThreadAndRun(assistantId: string, message: string, type: UserThreadTypes, appUserSession: string): Promise<ApiResponse<OpenAiRun>>;
    public abstract getThreadRun(assistantId: string, runId: string): Promise<ApiResponse<OpenAiRun>>;
    public abstract sendUserMessage(threadId: string, message: string): Promise<ApiResponse<OpenAiMessage>>;
}
