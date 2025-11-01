import { OpenAiMessage } from "../api/interfaces/IOpenAiClient";
import { UserChatMessage } from "../controllers/getUserChatMessages";

export default class OpenAiTransformUtils {
    static transformToUserMessage(message: OpenAiMessage): UserChatMessage {
        return {
            message: message.content[0].text.value,
            sender: message.role === "user" ? "user" : "buddy",
            timestamp: message.created_at
        }
    }
}