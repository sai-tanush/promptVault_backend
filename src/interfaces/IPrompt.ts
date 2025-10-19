import { Document, Types } from 'mongoose';

export interface IPrompt {
    userId: Types.ObjectId; 
    title: string;
    isDeleted: boolean; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IPromptDocument extends IPrompt, Document {}