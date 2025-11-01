import { IInstructionsBuilder } from "../IInstructionsBuilder";

export abstract class IRunInstructionsBuilder extends IInstructionsBuilder {

    constructor(protected _instructions: string) {
        super(_instructions);
    }

    abstract addResponseFormat(): void; 

}