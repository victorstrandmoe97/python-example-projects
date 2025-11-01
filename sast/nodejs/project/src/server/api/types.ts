export type OpenAiAssistant = {
    id: string;
    object: string;
    created_at: number;
    name: string;
    description: string | null;
    model: OpenAiModelType;
    instructions: string;
    tools: OpenAiTool[];
    file_ids: string[];
    metadata: Record<string, any>;
  }
  
export type OpenAiTool = {
    type: OpenAiToolType;
  }

  export type CreateProfilePicAssistantFunction = 
    {
      type: OpenAiToolType,
      function: {
        name: "create_profile_pic",
        description: 'Make the dog look like a real dog without human features and as closely resemble the breed and its colors and personality. do not answer with any text and add a thin border. dog_name, dog_breed, dog_age, dog_age_units, dog_social_level, dog_notes',
        parameters: {
          type: "object",
          properties: {
            dog_name: {
                type: "string",
                description: string,
            },
            dog_breed: {
                type: "string",
                description:string,
            },
            dog_age: {
                type: "string",
                description:string,
            },
            dog_age_units: {
                type: "string",
                description: string,
            },
            dog_social_level: {
                type: "string",
                description: string,
            },
            dog_notes: {
                type: "string",
                description: string,
            }, 
            dog_gender: {
                type: "string",
                description: string
            }
        },
        required: ["dog_name", "dog_breed", "dog_age", "dog_age_units", "dog_social_level", "dog_notes", "dog_gender"],
        }
      }
    }

type OpenAiToolType = "code_interpreter" | "function";
  
export type OpenAiModelType = "gpt-3.5-turbo" | "gpt-4-1106-preview";


export type OpenAiThread = {
    id: string;
    object: 'thread',
    created_at: number,
    metadata: object
}

export type UserThreadTypes = 'schedule' | 'exercises' | 'chat' | 'next-schedule' | 'day-schedule' | 'image-gen';

export type OpenAiAssistantFunction = 'create_profile_pic';