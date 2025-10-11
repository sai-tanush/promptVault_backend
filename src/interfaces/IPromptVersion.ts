import { Document, Types } from 'mongoose';
export interface IPromptObjects {
    title: string;
    description: string;
    tags: string[];
}
export interface IPromptVersion {
  promptId: Types.ObjectId; 
  event: 'create' | 'update' | 'delete';
  beforeObject?: IPromptObjects | null;
  afterObject?: IPromptObjects | null;
  versionNumber: number;
  createdAt: Date;
}

export interface IPromptVersionDocument extends IPromptVersion, Document {}
