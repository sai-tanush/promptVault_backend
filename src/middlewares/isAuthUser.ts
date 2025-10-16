import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/UserModel";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    username?: string;
    role?: string;
  };
}

export const isAuthUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    //Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];

    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id: string };

    //Check decoded payload
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    //Fetch user and ensure still exists
    const user = await User.findById(decoded.id).select("_id email username role");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    //Attach to req for controller use
    req.user = {
      _id: String(user._id),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(401).json({ success: false, message: "Not authorized, token invalid" });
  }
};
