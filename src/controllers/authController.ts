import { Request, Response } from 'express';
import { generateToken } from '../utils/generateToken';
import User from '../models/UserModel';
import { IUserDocument } from '../interfaces/IUser';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/isAuthUser';

export const registerUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Respond success
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, email: user.email },
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

export const loginUser = async (req: AuthRequest, res: Response) : Promise<void> => {

  try{
    const { email, password } = req.body;

    //Basic validation
    if( !email || !password){
      res.status(400).json({ message: 'email & password are required' });
      return;
    }

    //Check user credentials
    const user = await User.authenticate(email, password);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken((user._id as String).toString());

    // Respond success
    res.status(200).json({
      message: 'User logged-in successfully',
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  }
  catch(error: any){
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

export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id; 

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error: any) {
    console.error('❌ Internal Server error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
