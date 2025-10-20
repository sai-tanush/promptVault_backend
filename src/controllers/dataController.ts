import { Request, Response } from 'express';
import Prompt from '../models/PromptModel';
import PromptVersion from '../models/PromptVersionModel';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/isAuthUser';

export const getAllPromptsWithVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Fetch all prompts for the user
    const userPrompts = await Prompt.find({ userId: userId }).lean();

    // Fetch all versions for each prompt
    const promptsWithVersions = await Promise.all(
      userPrompts.map(async (prompt) => {
        const versions = await PromptVersion.find({ promptId: prompt._id })
          .sort({ versionNumber: 1 })
          .lean();
        
        // Extract the latest version's afterObject for convenience if needed, or just return all versions
        const latestVersion = versions.length > 0 ? versions[versions.length - 1].afterObject : null;

        return {
          title: prompt.title, // Assuming Prompt model has a title field, otherwise use latestVersion.title
          isDeleted: prompt.isDeleted,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt,
          latestVersion: latestVersion, // Include latest version data
          allVersions: versions, // Include all versions data
        };
      })
    );

    res.status(200).json({
      success: true,
      count: promptsWithVersions.length,
      message: "All prompts with their versions fetched successfully.",
      data: promptsWithVersions,
    });

  } catch (error) {
    console.error("❌ Error fetching all prompts with versions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const importPromptsFromJson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const importedData = req.body;

    if (!Array.isArray(importedData)) {
      res.status(400).json({ success: false, message: "Invalid data format. Expected an array of prompts." });
      return;
    }

    const createdPrompts = [];
    const createdVersions = [];

    for (const promptData of importedData) {
      // Validate prompt structure
      if (!promptData.title || !promptData.versions || !Array.isArray(promptData.versions) || promptData.versions.length === 0) {
        console.warn("Skipping invalid prompt data:", promptData);
        continue;
      }

      const newPrompt = await Prompt.create({
        userId: new mongoose.Types.ObjectId(userId.toString()),
        title: promptData.title.trim(),
        isDeleted: promptData.isDeleted || false,
      });

      for (let i = 0; i < promptData.versions.length; i++) {
        const versionData = promptData.versions[i];
        const versionNumber = i + 1;

        // Basic validation for version data
        if (!versionData.afterObject || !versionData.event) {
          console.warn(`Skipping invalid version data for prompt ${newPrompt._id}:`, versionData);
          continue;
        }

        await PromptVersion.create({
          promptId: newPrompt._id,
          event: versionData.event,
          beforeObject: versionData.beforeObject || null,
          afterObject: versionData.afterObject,
          versionNumber: versionNumber,
        });
        createdVersions.push({ promptId: newPrompt._id, versionNumber });
      }
      createdPrompts.push(newPrompt._id);
    }

    res.status(201).json({
      success: true,
      message: "Prompts imported successfully.",
      data: {
        createdPromptIds: createdPrompts,
        createdVersionCount: createdVersions.length,
      },
    });

  } catch (error) {
    console.error("❌ Error importing prompts:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ message: "Validation failed during import", errors: messages });
      return;
    }
    res.status(500).json({ message: "Internal server error during import" });
  }
};
