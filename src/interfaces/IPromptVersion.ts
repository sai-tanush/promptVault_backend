import { Document, Types } from 'mongoose';

export interface IPromptVersion {
    promptId: Types.ObjectId; 
    content: string; 
    versionNumber: number;
    createdAt: Date;
}

export interface IPromptVersionDocument extends IPromptVersion, Document {}