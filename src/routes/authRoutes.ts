import express from 'express';
import { loginUser, registerUser } from '../controllers/authController';
import { validatePassword } from '../middlewares/validatePassword';

const router = express.Router();

router.post('/register', validatePassword, registerUser);
router.post('/login', loginUser);

export default router;
