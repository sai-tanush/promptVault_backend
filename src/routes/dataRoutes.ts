import express from 'express';
import { isAuthUser } from '../middlewares/isAuthUser';
import { getAllPromptsWithVersions } from '../controllers/dataController';
import { importPromptsFromJson } from '../controllers/dataController';

const router = express.Router();

router.get('/export', isAuthUser, getAllPromptsWithVersions);
router.post("/import", isAuthUser, importPromptsFromJson);

export default router;
