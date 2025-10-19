import express from 'express';
import { getUserDetails, loginUser, registerUser } from '../controllers/authController';
import { validatePassword } from '../middlewares/validatePassword';
import { isAuthUser } from '../middlewares/isAuthUser';

const router = express.Router();

router.post('/register', validatePassword, registerUser);
router.post('/login', loginUser);
router.get('/user', isAuthUser, getUserDetails );

export default router;
