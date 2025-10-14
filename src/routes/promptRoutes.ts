import express from "express";
import { createPrompt, updatePrompt } from "../controllers/promptController";
import { isAuthUser } from "../middlewares/isAuthUser";

const router = express.Router();

router.post("/create", isAuthUser, createPrompt);
router.post("/update/:id", isAuthUser, updatePrompt);

export default router;
