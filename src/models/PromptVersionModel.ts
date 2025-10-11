import { Schema, model, Types } from 'mongoose';
import { IPromptVersionDocument } from '../interfaces/IPromptVersion';

const PromptVersionSchema = new Schema<IPromptVersionDocument>({
    promptId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Prompt ID is required'],
        ref: 'Prompt',
        index: true, 
    },
    content: {
        type: String,
        required: [true, 'Prompt content is required'],
    },
    versionNumber: {
        type: Number,
        required: true,
        min: 1,
    },
}, {
    timestamps: { 
        createdAt: true, 
        updatedAt: false
    }, 
    collection: 'promptversions'
});

PromptVersionSchema.index({ promptId: 1, versionNumber: 1 }, { unique: true });

const PromptVersion = model<IPromptVersionDocument>('PromptVersion', PromptVersionSchema);

export default PromptVersion;