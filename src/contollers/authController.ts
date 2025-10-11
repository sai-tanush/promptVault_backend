import { Request, Response } from 'express';
import { generateToken } from '../utils/generateToken';
import User from '../models/UserModel';
import { IUserDocument } from '../interfaces/IUser';

export const registerUser = async (req: Request, res: Response) => {
	try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user: IUserDocument = await User.create({ username, email, password });
    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}