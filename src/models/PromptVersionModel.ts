import { Schema, model, Types } from 'mongoose';
import { IPromptVersionDocument } from '../interfaces/IPromptVersion';

const PromptVersionObject = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], required: true},
}, { _id: false }); 

const PromptVersionSchema = new Schema<IPromptVersionDocument>({
  promptId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Prompt ID is required'],
    ref: 'Prompt',
    index: true,
  },

  event: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: [true, 'Event type is required'],
  },

  beforeObject: {
    type: PromptVersionObject,
    default: null,
  },

  afterObject: {
    type: PromptVersionObject,
    default: null,
  },

  versionNumber: {
    type: Number,
    required: true,
    min: 1,
  },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
  collection: 'promptversions',
});

// Ensure each prompt has unique version numbers
PromptVersionSchema.index({ promptId: 1, versionNumber: 1 }, { unique: true });

const PromptVersion = model<IPromptVersionDocument>('PromptVersion', PromptVersionSchema);

export default PromptVersion;
