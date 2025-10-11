import jwt, { Secret } from 'jsonwebtoken';

export const generateToken = (id: string) => {
	const secret = process.env.JWT_SECRET as Secret;
  	const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

	return jwt.sign({ id }, secret, { expiresIn: expiresIn as any });
}