import { Request, Response, NextFunction } from 'express';

export const validatePassword = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  // Strong password check (optional)
  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must include uppercase, lowercase, number, and special character'
    });
  }

  next();
};
