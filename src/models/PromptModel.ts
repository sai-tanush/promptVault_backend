import { Schema, model, Types } from 'mongoose';
import { IPromptDocument } from '../interfaces/IPrompt';

const PromptSchema = new Schema<IPromptDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User', 
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        unique: false,
    },
    description: {
        type: String,
        default: '',
    },
    tags: {
        type: [String],
        default: [],
        index: true,
    },
    currentVersion: {
        type: Number,
        required: true,
        default: 1,
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

PromptSchema.index({ userId: 1, title: 1 }, { unique: true });

const Prompt = model<IPromptDocument>('Prompt', PromptSchema);

export default Prompt;
