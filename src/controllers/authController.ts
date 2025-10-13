import { Request, Response } from 'express';
import { generateToken } from '../utils/generateToken';
import User from '../models/UserModel';
import { IUserDocument } from '../interfaces/IUser';
import mongoose from 'mongoose';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email ) {
      res.status(400).json({ message: 'All fields (username, email) are required' });
      return;
    }

    // Check for existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    // Create new user
    const user: IUserDocument = await User.create({ username, email, password });
    const token = generateToken((user._id as String).toString());

    // Respond success
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error: any) {
    // Handle duplicate key error (MongoDB) when multiple requests come in together
    if (error.code === 11000) {
      res.status(409).json({ message: 'Duplicate field value entered' });
      return;
    }

    // Handle validation errors (Mongoose) - DB model error
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ message: 'Validation failed', errors: messages });
      return;
    }

    // Default catch-all for unknown errors
    console.error('❌ Internal Server error');
    res.status(500).json({ message: 'Internal server error' });
  }
};
