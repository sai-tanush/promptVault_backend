import express from 'express';
import { registerUser } from '../controllers/authController';
import { validatePassword } from '../middlewares/validatePassword';

const router = express.Router();

router.post('/register', validatePassword, registerUser);

export default router;
