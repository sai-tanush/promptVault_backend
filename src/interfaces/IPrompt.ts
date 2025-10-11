import { Document, Types } from 'mongoose';

export interface IPrompt {
    userId: Types.ObjectId; 
    title: string;
    description: string;
    tags: string[]; 
    currentVersion: number; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IPromptDocument extends IPrompt, Document {}