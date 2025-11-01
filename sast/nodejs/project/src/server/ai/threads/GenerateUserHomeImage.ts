import { IThreadInstructionsBuilders } from "./IThreadInstructionsBuilder";

export default class GenerateUserHomeImage extends IThreadInstructionsBuilders {

    constructor() {
        super('create a circular cartoon cheerful social media profile picture.'+
         'make the dog look like a real dog without human features to as closely resemble the breed and its colors and personality.'+
         'do not answer with any text with a thin border');
    }

    public addResponseFormat() {
        return 'return in json format.';
    }
}