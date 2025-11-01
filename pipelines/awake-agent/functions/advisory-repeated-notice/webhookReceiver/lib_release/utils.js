import { todayDateString } from "./date.js";

export function logError(context, error) {
    const timestamp = todayDateString();
    console.error(`[${timestamp}] Error in ${context}:`);
    console.error(`  Name: ${error.name}`);
    console.error(`  Message: ${error.message}`);
    if (error.stack) console.error(`  Stack: ${error.stack}`);
    if (error.errors) {
      console.error(`  Details: ${JSON.stringify(error.errors, null, 2)}`);
    }
    if(error.response.insertErrors) {
        console.error(`  Details: ${JSON.stringify(error.response.insertErrors, null, 2)}`);
    }
  }
