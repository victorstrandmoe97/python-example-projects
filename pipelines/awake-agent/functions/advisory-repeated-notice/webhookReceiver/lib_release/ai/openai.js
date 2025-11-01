import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Creates a chat completion using OpenAI's API
 * @param {string} prompt - The prompt to send to OpenAI
 * @param {string} model - The model to use (defaults to gpt-4-turbo-preview)
 * @returns {Promise<string>} The generated response
 */
export async function createChatCompletion(
    prompt,
    instructions = '',
    model = 'gpt-3.5-turbo',
    temperature = 0.4,
    maxTokens = 3000,
) {
  try {
    const promptText = Array.isArray(prompt) ? prompt.join('\n') : prompt;
    
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: instructions
        },
        { 
          role: 'user', 
          content: [{ type: 'text', text: promptText }]
        },
      ],
      model: model,
      temperature: temperature,
      max_completion_tokens: maxTokens,
    });

    const inputTokens = completion.usage.prompt_tokens;
    const outputTokens = completion.usage.completion_tokens;
    const cost = calculateCost(model, inputTokens, outputTokens);
    
    console.log(`Cost for this request: $${cost.toFixed(4)} (${inputTokens} input tokens, ${outputTokens} output tokens)`);

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error creating chat completion:', error);
    throw error;
  }
}

function calculateCost(model, inputTokens, outputTokens) {
  // Pricing per 1K tokens as of March 2024
  const pricing = {
    'gpt-4-turbo-preview': {
      input: 0.01,   // $0.01 per 1K input tokens
      output: 0.03   // $0.03 per 1K output tokens
    },
    'gpt-4': {
      input: 0.03,
      output: 0.06
    },
    'gpt-3.5-turbo': {
      input: 0.0005,
      output: 0.0015
    }
  };

  const modelPricing = pricing[model] || pricing['gpt-4-turbo-preview'];
  
  return (inputTokens * modelPricing.input / 1000) + 
         (outputTokens * modelPricing.output / 1000);
}

export default openai; 