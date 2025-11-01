import { IMessageInstructionsBuilder } from "./IMessageInstructionsBuilder";

export default class RunSendMessageInstructionsBuilder extends IMessageInstructionsBuilder {

    constructor() {
        super('Respond to the user message that comes from your client. Respond as accurately as possible related to dog Obedience, health, lifestyle, activitie, anatomy, igp/schutzhund training, dog-human, dog sign language, dog nutrition, dog behaviour, dog socializing, dog grooming, dog breeding, dog tracking , dog protection, dog huring, dog hunting, dog sledding, dog agiligty')
    }

   addBounds(): RunSendMessageInstructionsBuilder {
        this.addInstruction('in case veterinarian question, give some facts on the topic and emphasize on consulting real one.');
        this.addInstruction('in case dietary questions focus on giving specific advice on nutrition for that age and breed and activity level, and give specific advice on what foods could be good for the dog with its lifestyle. Mention how the user can themselves find out whats best for the dog ');
        this.addInstruction('reference statistics, historical studies, common sense, psychology, life philosophy, anatomical, chemical studies in answers when recommending something to be as informative and useful as possible to your client.');
        return this;
    }

    addImprovements(): RunSendMessageInstructionsBuilder {
        this.addInstruction('If the user asks for how they should adjust their routines give specific advice on how to adjust their routines to better suit their dog and lifestyle.');
        return this;
    }    
    addResponseFormat(): RunSendMessageInstructionsBuilder {
        this.addInstruction('Respond in text as if you are chatting directly to the client. Keep your replies relatively short yet informative as they will be rendered on a mobile chat screen.');
        this.addInstruction('Keep your reply under 2000 characters but dont shy on details. ');
        this.addInstruction('Do not include any other output than the text response. ');
        return this;
    }
    
}