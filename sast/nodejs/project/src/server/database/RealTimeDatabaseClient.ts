import {  ref, set, Database } from "firebase/database";
import { UserFeedbackEntry } from "./models/UserFeedbackEntry";

export abstract class IRealtimeDatabaseRepository {
    abstract db: Database;
    abstract addUserFeedback(feedback: UserFeedbackEntry): Promise<void>;
}

export class RealtimeDatabaseRepository extends IRealtimeDatabaseRepository {
  db: Database;

  constructor(firebaseApp: any, databaseURL: string) {
    super();
    this.db = firebaseApp.database(databaseURL);
  }

  public async addUserFeedback(feedback: UserFeedbackEntry): Promise<void> {
    const timestamp = Date.now();
    const feedbackRef = ref(this.db, `feedback/${feedback.user_session_id}/${timestamp}`);
    await set(feedbackRef, feedback);
  }
}
