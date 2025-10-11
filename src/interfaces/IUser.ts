import { Document } from 'mongoose';

export interface IUser {
    username: string;
	first_name: string;
    email: string;
    password?: string; 
    role: 'standard' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}