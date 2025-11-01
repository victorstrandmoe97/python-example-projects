import { DayOfWeek } from "../../api/UserRepository";
import { TrainingDayArea, TrainingDayFocus } from "../assistants/ScheduleAssistant";
import { IThreadInstructionsBuilders } from "./IThreadInstructionsBuilder";

export default class GenerateDayScheduleInstructionsBuilder extends IThreadInstructionsBuilders {

    constructor() {
        super('Your client specifically asked to change the schedule for one day. Here are the instruction')
    }


    addSpecifications(
        dayOfWeek: DayOfWeek,
        focus: TrainingDayFocus,
        duration: string,
        area: TrainingDayArea
    ): GenerateDayScheduleInstructionsBuilder {
        this.addInstruction(`Create a revised version for ${dayOfWeek} where the  focus  is on ${focus}  for ${duration} minutes for morning and evening. The training will happen at ${area} for morning and evening`);
        this.addInstruction(`Introduce possibility for progression between morning and evening`)
        this.addInstruction(`Explain each session in detail. Dont state that you are performing the activity. Be detailed. The user selected these categories to come with useful exercises, activities, interactions that will benefit the wellbeing and life of the client and the dog.`)
        return this;
    }

    addExistingSchedule(existingSchedule: string): GenerateDayScheduleInstructionsBuilder {
        this.addInstruction(`The current schedule is: ${existingSchedule}`)
        return this;
    }

    addTip(): GenerateDayScheduleInstructionsBuilder {
        this.addInstruction(`Add a tip that is relevant to the exercise generate. Keep it short and to the point. and assign it to a tip property in the response.`)
        return this;
    }
    addExamples(): GenerateDayScheduleInstructionsBuilder {
        this.addInstruction(`example if revised version was for monday: {"monday":{"morning":"Focus on dog-dog socialization for 15 minutes at the Beach...Monitor their body language and behavior closely to ensure positive socialization experiences. Encourage playful interactions and mutual sniffing to establish a bond with the other dog. This session helps...","tips": "Mention pitfalls, practical tips, extra support..", "evening":"Focus on dog-dog socialization for 15 minutes at the Beach... Observe their dynamics and intervene if necessary to maintain a positive interaction. This activity enhances Elon's ability to adapt to various social situations..."}}}`)
        return this
    }
    
    addResponseFormat(): GenerateDayScheduleInstructionsBuilder {
        this.addInstruction(`Respond in parseable JSON string only. 
        Return the same format as the current schedule with the day of week as primary key. Keep primary key lower case.
        Dont include markdown in your response
        Dont add title. dont repeat exercises, activities and interactions.
        Add examples but dont quote the name. different exercise for morning and for evening. 
        Minimum 4 sentences for morning and 4 sentences for evening`)
        return this
    }

}