import ServerClient from "./server/ServerClient";
import ChatAssistant from "./server/ai/assistants/ChatAssistant";
import ExercisesAssistant from "./server/ai/assistants/ExercisesAssistant";
import ImageAssistant from "./server/ai/assistants/ImageAssistant";
import ScheduleAssistant from "./server/ai/assistants/ScheduleAssistant";
import OpenAiApiClient from "./server/api/OpenAiClient";
import UserRepository from "./server/api/UserRepository";
import { config } from 'dotenv';
import { RealtimeDatabaseRepository } from "./server/database/RealTimeDatabaseClient";
import admin from "firebase-admin";


var serviceAccount = require("../firebase-service-account.json");



config();

export const APP_PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const OPENAI_API_KEY: string = process.env.OPEN_AI_API_KEY || '';
const OPEN_AI_API_VERSION: string = process.env.OPEN_AI_API_VERSION || 'v1';
const OPEN_AI_API_URL: string = process.env.OPEN_AI_API_URL || '';

const CHAT_ASSISTANT_ID: string = process.env.CHAT_ASSISTANT_ID || '';
const SCHEDULE_ASSISTANT_ID: string = process.env.SCHEDULE_ASSISTANT_ID || '';
const EXERCISES_ASSISTANT_ID: string = process.env.EXERCISES_ASSISTANT_ID || '';
const IMAGE_ASSISTANT_ID: string = process.env.IMAGE_ASSISTANT_ID || '';

export const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY || '';
export const AI_RESPONSE_MAX_RETRY_COUNT: number = process.env.AI_RESPONSE_MAX_RETRY_COUNT ? parseInt(process.env.AI_RESPONSE_MAX_RETRY_COUNT) : 2;
export const AI_RESPONSE_POLLING_INTERVAL: number = process.env.AI_RESPONSE_POLLING_INTERVAL ? parseInt(process.env.AI_RESPONSE_POLLING_INTERVAL) : 10000;
export const AI_RESPONSE_INITIAL_DELAY: number = process.env.AI_RESPONSE_INITIAL_DELAY ? parseInt(process.env.AI_RESPONSE_INITIAL_DELAY) : 8000;


// const FIREBASE_API_KEY: string = process.env.FIREBASE_API_KEY || '';
// const FIREBASE_AUTH_DOMAIN: string = process.env.FIREBASE_AUTH_DOMAIN || '';
const FIREBASE_DATABASE_URL: string = process.env.FIREBASE_DATABASE_URL || '';
// const FIREBASE_PROJECT_ID: string = process.env.FIREBASE_PROJECT_ID || '';
// const FIREBASE_STORAGE_BUCKET: string = process.env.FIREBASE_STORAGE_BUCKET || '';
// const FIREBASE_MESSAGING_SENDER_ID: string = process.env.FIREBASE_MESSAGING_SENDER_ID || '';
// const FIREBASE_APP_ID: string = process.env.FIREBASE_APP_ID || '';
// const FIREBASE_MEASUREMENT_ID: string = process.env.FIREBASE_MEASUREMENT_ID || '';


const firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: FIREBASE_DATABASE_URL,
});

export const database = new RealtimeDatabaseRepository(firebase, FIREBASE_DATABASE_URL);

const OpenAiClient = new OpenAiApiClient(OPENAI_API_KEY, OPEN_AI_API_VERSION, OPEN_AI_API_URL);
const chatAssistant = new ChatAssistant(OpenAiClient, CHAT_ASSISTANT_ID!);
const scheduleAssistant = new ScheduleAssistant(OpenAiClient, SCHEDULE_ASSISTANT_ID!);
const exercisesAssistant = new ExercisesAssistant(OpenAiClient, EXERCISES_ASSISTANT_ID!);
const imageAssistant = new ImageAssistant(OpenAiClient, IMAGE_ASSISTANT_ID!);

export const UserRepo = new UserRepository(scheduleAssistant, chatAssistant, exercisesAssistant, imageAssistant, database);


const app = new ServerClient();
app.run()