import express from "express";
import { archivePrompt, createPrompt, deletePrompt, getPrompts, getPromptWithVersions, updatePrompt } from "../controllers/promptController";
import { isAuthUser } from "../middlewares/isAuthUser";

const router = express.Router();

router.post("/create", isAuthUser, createPrompt);
router.post("/update/:id", isAuthUser, updatePrompt);
router.delete("/prompt/:id", isAuthUser, deletePrompt)
router.patch("/archieve/:id", isAuthUser, archivePrompt);
router.get("/getprompts", isAuthUser, getPrompts);
router.get("/prompt/:id", isAuthUser, getPromptWithVersions);

export default router;
