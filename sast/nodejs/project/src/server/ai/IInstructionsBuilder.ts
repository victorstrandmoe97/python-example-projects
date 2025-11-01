export abstract class IInstructionsBuilder {

    constructor(protected _instructions: string) {
    }

    protected addInstruction(instruction: string): void {
        this._instructions += '. '+instruction;
    }


    build(): string {
        return this._instructions;
    }
}




