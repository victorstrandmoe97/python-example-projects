import { DogAgeUnits } from "../../../types/dog";

export type UserFeedbackEntry = {
    app_version?: string;
    user_session_id: string;
    created_at: number;
    chat_thread_id: string
    schedule_thread_id: string
    improvement_input?: string;
    issue_report_input?: string;
    dog_name?: string;
    dog_breed?: string;
    dog_age?: number;
    dog_age_units?: DogAgeUnits;
    dog_gender?: string;
    dog_social_level?: string;
}