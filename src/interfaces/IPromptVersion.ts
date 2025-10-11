import { Document, Types } from 'mongoose';
export interface IPromptVersion {
  promptId: Types.ObjectId; 

  event: 'create' | 'update' | 'delete';

  beforeObject?: Record<string, any> | null;

  afterObject?: Record<string, any> | null;

  versionNumber: number;

  createdAt: Date;
}

export interface IPromptVersionDocument extends IPromptVersion, Document {}
