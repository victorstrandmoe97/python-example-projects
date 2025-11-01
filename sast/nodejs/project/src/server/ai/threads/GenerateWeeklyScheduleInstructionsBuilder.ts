import { RunExamples } from "../runs/RunExamples";
import { IThreadInstructionsBuilders } from "./IThreadInstructionsBuilder";

export default class GenerateWeeklyScheduleInstructionsBuilder extends IThreadInstructionsBuilders {

    private hasExistingSchedule: boolean;
    constructor() {
        super('create a custom training schedule for your client in json format.')
        this.hasExistingSchedule = false;
    }

    addDateRange(): GenerateWeeklyScheduleInstructionsBuilder {
        this.addInstruction(`Create the schedule for the next 7 days. `);
        return this;
    }

    addSpecifications(): GenerateWeeklyScheduleInstructionsBuilder {
        this.addInstruction(`Try gently suggesting to work on social areas that have been reported as anything other than good with all dogs`
        + `Ensure all instructions are step by step in as concise format as possible. make the instructions practical and success measurable.'`);
        
        return this;
    }

    addTip(): GenerateWeeklyScheduleInstructionsBuilder {
        this.addInstruction('Incldue a tip for every day which gives common mistakes while performing the exercises and use varying opening words to not sound repetative.');
        
        return this; 
    }

    addExistingSchedule(schedule: string): GenerateWeeklyScheduleInstructionsBuilder {
        this.addInstruction('Use the following  existing schedule as a reference to create a continuation gradually increase the difficulty over time according to the dogs previously specified breed, age, maturity, social level, gender, or notes and  the json output format: \n' + schedule );
        this.hasExistingSchedule = true;
        return this; 
    }

    addResponseFormat(): GenerateWeeklyScheduleInstructionsBuilder {
        this.addInstruction(`each day of the week (monday, tuesday... etc) as a key  ` + 
        ` titled exercises should not interfer with the parsing of the response format escape the inner double quotes by preceding them with a backslash (\)..`+ 
        ` do not include any other output than the json \n` + 
        ` for individual game name use the following format: "Game Name" ` +
        !this.hasExistingSchedule ? (`Example output as follows: ` +  RunExamples.GENERATE_SCHEDULE_EXAMPLE) : '');
        //TODO: Add exampl
        return this
    }

}