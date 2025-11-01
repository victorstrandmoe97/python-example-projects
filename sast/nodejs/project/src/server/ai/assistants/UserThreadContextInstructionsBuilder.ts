import { IInstructionsBuilder } from "../IInstructionsBuilder";

export default class UserThreadContextInstructionsBuilder extends IInstructionsBuilder {

    constructor() {
        super("You are a personal dog obedience trainer.");
    }


    public rememberDog(): UserThreadContextInstructionsBuilder {
        this.addInstruction(`Refer to previously.`);
        return this;
    }
    public addName(value: string): UserThreadContextInstructionsBuilder {
        this.addInstruction(`Dog client name: ${value}.`);
        return this;
    }

    public addDescription(gender: string, breed: string, ageValue: number, ageUnit: string): UserThreadContextInstructionsBuilder {
        this.addInstruction(`This dog is a ${gender} ${breed} that is ${ageValue} ${ageUnit} old. to take into account in every response`);
        return this;
    }

    public addSocialLevel(value: string): UserThreadContextInstructionsBuilder {
        this.addInstruction(`This dog's social behaviour is observed as: ${value}. to take into account in every response.`);
        return this;
    }

    public addNotes(value: string): UserThreadContextInstructionsBuilder {
        this.addInstruction(`User inputed notes to take into account in every response: ${value}.`);
        return this;
    }
    //ChatAssistant
    public addChatInstructions(): UserThreadContextInstructionsBuilder {
        this.addInstruction(`You will respond to client messages and respond to them in a way that is helpful and informative and specific and pragmatic.dont include formatting characters. Explain concepts in a way that is easy to understand and practical to apply to every day life.`);
        return this;
    }
}