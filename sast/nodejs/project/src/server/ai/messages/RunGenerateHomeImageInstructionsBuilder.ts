import { IRunInstructionsBuilder } from "../runs/IRunInstructionsBuilder";

export default class RunGenerateHomeImageInstructionsBuilder extends IRunInstructionsBuilder {

    constructor() {
        super('cheerful  dog from a pixar movie. ');
    }
    addUserContext(
        gender: string,
        breed: string,
        age: number,
        ageUnits: string,

    ): RunGenerateHomeImageInstructionsBuilder {
        this.addInstruction('A' + gender + ' ' + breed + ' dog, ' + age + ' ' + ageUnits + ' old.');
        return this;
    }

    addResponseFormat(): RunGenerateHomeImageInstructionsBuilder {
       return this;
    }

}