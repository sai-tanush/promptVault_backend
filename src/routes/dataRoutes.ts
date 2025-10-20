import express from 'express';
import { isAuthUser } from '../middlewares/isAuthUser';
import { getAllPromptsWithVersions } from '../controllers/dataController';

const router = express.Router();

router.get('/export', isAuthUser, getAllPromptsWithVersions);
router.post('/import/:id', isAuthUser,)

export default router;
