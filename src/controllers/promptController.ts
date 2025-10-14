import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Prompt from "../models/PromptModel";
import PromptVersion from "../models/PromptVersionModel";
import { AuthRequest } from "../middlewares/isAuthUser";

export const createPrompt = async (req: AuthRequest, res: Response ): Promise<void> => {

	try{
		if (!req.user || !req.user._id) {
		res.status(401).json({ success: false, message: "Unauthorized" });
		return;
    	}

		const { title, description, tags } = req.body;

		// Basic validation
		if (!title || !description) {
		res.status(400).json({
			success: false,
			message: 'Title and description are required.',
		});
		return;
		}

		//Basic validation for tags
		if (tags && (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string'))) {
		res.status(400).json({
			success: false,
			message: 'Tags must be an array of strings.',
		});
		return;
		}

		//Trim input fields
		const trimmedTitle = title.trim();
		const trimmedDescription = description.trim();
		const cleanTags = (tags || []).map((t: string) => t.trim());

		// Create the new prompt
		const newPrompt = await Prompt.create({
			userId: new mongoose.Types.ObjectId(req.user._id.toString()),
			title: trimmedTitle,
			description: trimmedDescription,
			tags: cleanTags,
			currentVersion: 1,
		});

		// Create the initial version record
		await PromptVersion.create({
			promptId: newPrompt._id,
			event: 'create',
			beforeObject: null,
			afterObject: {
				title: newPrompt.title,
				description: newPrompt.description,
				tags: newPrompt.tags,
			},
			versionNumber: 1,
		});

		res.status(201).json({
		success: true,
		message: "Prompt created successfully.",
		data: newPrompt,
		});
	}	
	catch(error){
		// Handle validation errors (Mongoose) - DB model error
		if (error instanceof mongoose.Error.ValidationError) {
			const messages = Object.values(error.errors).map((val) => val.message);
			res.status(400).json({ message: 'Validation failed', errors: messages });
			return;
		}
		
		// Default catch-all for unknown errors
		console.error('❌ Internal Server error');
		res.status(500).json({ message: 'Internal server error' });
	}
}