import { Schema, model, Types } from 'mongoose';
import { IPromptDocument } from '../interfaces/IPrompt';

const PromptSchema = new Schema<IPromptDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User', 
        index: true,
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true,
    collection: 'prompts'
});

PromptSchema.index({ userId: 1 });

const Prompt = model<IPromptDocument>('Prompt', PromptSchema);

export default Prompt;
