import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel';

interface AuthRequest extends Request {
  user?: any;
}

export const isAuthUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  // 1. Check for Authorization header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    // 2. Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // 3. Attach user info to request
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
