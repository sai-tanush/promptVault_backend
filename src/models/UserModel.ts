import { Schema, model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { IUserDocument } from '../interfaces/IUser';

const UserSchema = new Schema<IUserDocument>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        maxlength: 50,
    },
	first_name: {
		tyep: String,
		required: [true, "First name is required"],
		trim: true,
		maxlength: 50,
	},
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        // We will select: false in methods to prevent accidentally sending hash
        select: false,
    },
    role: {
        type: String,
        enum: ['standard', 'admin'],
        default: 'standard',
    },
}, {
    timestamps: true,
    collection: 'users'
});

