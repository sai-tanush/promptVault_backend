import { Request, Response } from 'express';
import Prompt from '../models/PromptModel';
import PromptVersion from '../models/PromptVersionModel';
import mongoose from 'mongoose';

export const getAllPromptsWithVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch prompts, filter by isDeleted = false, and sort by createdAt descending
    const prompts = await Prompt.find({ isDeleted: false }).sort({ createdAt: -1 });

    // For each prompt, fetch its versions
    const promptsWithVersions = await Promise.all(
      prompts.map(async (prompt) => {
        const versions = await PromptVersion.find({ promptId: prompt._id });
        return {
          ...prompt.toObject(), // Convert Mongoose document to plain object
          versions: versions.map(v => v.toObject()), // Convert versions to plain objects
        };
      })
    );

    // Respond with the data in JSON format
    res.status(200).json(promptsWithVersions);
  } catch (error: any) {
    // Handle potential errors during database operations
    if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }
    console.error('❌ Internal Server error fetching prompts with versions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
