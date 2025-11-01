import { UserSavedExercise } from "../../controllers/postGenerateExercise";
import { IRunInstructionsBuilder } from "./IRunInstructionsBuilder";
import { RunExamples } from "./RunExamples";

export default class GenerateExerciseInstructionsBuilder extends IRunInstructionsBuilder {

    constructor() {
        super('Create a single new interactive fun exercise for your client and also including basic steps on how to execute the exercise..');
    }

    addTip(): GenerateExerciseInstructionsBuilder {
        this.addInstruction('Incldue a tip which gives a common mistake or how to improve difficulty or  while performing the exercise and use more encouraging words. Present the tip by talking directly to your client.')
        return this; 
    }

    addResponseFormat(): GenerateExerciseInstructionsBuilder {
        this.addInstruction(`respond to this in a plain json object without markdown annotation. Explain the exercise on the property \'content\' and a random tip under the property name \'tip\' and a \'title\'.
        'Include the dogs name in the exercise in title case. Max word count for content: 100 words max word count for tip 75 words max'
        'Example: ${RunExamples.GENERATE_EXERCISES_EXAMPLE}`);

        return this
    }

    addSavedExercises(savedExercises: UserSavedExercise[]): GenerateExerciseInstructionsBuilder {
        const exercisesInstructions = savedExercises.map((exercise: UserSavedExercise) => {
            return `\n${exercise.content} \n`;
        })

        const instructions = "You have previously created the following exercises for this dog: " + exercisesInstructions.join('\n') + 
        "\n If any, you can use these exercises as a reference for creating new exercises but do not repeat the same exercise and ensure the exercise is varying in methods from the saved exercises earlier in the message.";


        this.addInstruction(instructions);

        return this;
    }

}