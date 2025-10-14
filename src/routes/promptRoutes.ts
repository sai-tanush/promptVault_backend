import express from "express";
import { createPrompt, deletePrompt, updatePrompt } from "../controllers/promptController";
import { isAuthUser } from "../middlewares/isAuthUser";

const router = express.Router();

router.post("/create", isAuthUser, createPrompt);
router.post("/update/:id", isAuthUser, updatePrompt);
router.delete("/prompt/:id", isAuthUser, deletePrompt)

export default router;
