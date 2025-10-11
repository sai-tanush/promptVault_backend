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
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please fill a valid email address'],
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

// Pre-Save Hook (Password Hashing)
UserSchema.pre('save', async function (next) {
    const user = this;

    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password!, salt);
        user.password = hashedPassword;
        
        next();
    }catch (error: any) {
        next(error);
	}
});

UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (!update) return next();

  const password = update.password || update.$set?.password;
  if (!password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    if (update.password) {
      update.password = hashed;
    } else {
      update.$set.password = hashed;
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});


// Instance Methods (Password Comparison)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password!);
};

const User = model<IUserDocument>('User', UserSchema);

export default User;