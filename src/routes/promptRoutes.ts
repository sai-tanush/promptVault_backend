import express from "express";
import { archivePrompt, createPrompt, deletePrompt, restorePrompt, updatePrompt, getPromptWithLatestVersion, getPromptWithAllVersions, getAllUserPrompts } from "../controllers/promptController";
import { isAuthUser } from "../middlewares/isAuthUser";

const router = express.Router();

router.post("/", isAuthUser, createPrompt);
router.patch("/:promptId", isAuthUser, updatePrompt);
router.delete("/:promptId", isAuthUser, deletePrompt)
router.patch("/:promptId/archive", isAuthUser, archivePrompt);
router.patch("/:promptId/restore", isAuthUser, restorePrompt);
router.post("/", isAuthUser, getAllUserPrompts)
router.get("/:promptId/latest", isAuthUser, getPromptWithLatestVersion);
router.get("/:promptId/versions", isAuthUser, getPromptWithAllVersions);

export default router;
