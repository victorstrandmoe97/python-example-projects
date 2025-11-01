import { IInstructionsBuilder } from "../IInstructionsBuilder";

export abstract class IMessageInstructionsBuilder extends IInstructionsBuilder {

    constructor(protected _instructions: string) {
        super(_instructions);
    }

    abstract addResponseFormat(): void; 
}