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

    // Map prompts to the desired JSON structure
    const formattedPrompts = await Promise.all(
      userPrompts.map(async (prompt) => {
        // Fetch all versions for the current prompt
        const versions = await PromptVersion.find({ promptId: prompt._id })
          .sort({ versionNumber: 1 }) // Ensure versions are ordered
          .lean();

        // Format each version according to the user's request
        const formattedVersions = versions.map((version) => {
          // Safely access properties from afterObject
          const afterObject = version.afterObject;
          return {
            title: (afterObject && typeof afterObject.title === 'string') ? afterObject.title : '', // Use title from afterObject, provide default if not string or if afterObject is null/undefined
            tage: (afterObject && Array.isArray(afterObject.tags)) ? afterObject.tags : [], // Use tags from afterObject, provide default if not array or if afterObject is null/undefined
            description: (afterObject && typeof afterObject.description === 'string') ? afterObject.description : '', // Use description from afterObject, provide default if not string or if afterObject is null/undefined
          };
        });

        return {
          title: prompt.title, // Main prompt title
          versions: formattedVersions, // Array of formatted versions
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedPrompts.length,
      message: "All prompts with their versions fetched successfully in the requested format.",
      data: formattedPrompts,
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

    // Assuming the JSON data is sent in the request body.
    // In a real-world scenario, you'd likely use middleware like 'multer' to handle file uploads.
    // For this example, we'll assume req.body contains the parsed JSON array of prompts.
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
        continue; // Skip this prompt if it's malformed
      }

      // Create the main Prompt entry
      const newPrompt = await Prompt.create({
        userId: new mongoose.Types.ObjectId(userId.toString()),
        title: promptData.title.trim(),
        isDeleted: promptData.isDeleted || false, // Default to not deleted if not specified
      });

      // Create all associated versions
      for (let i = 0; i < promptData.versions.length; i++) {
        const versionData = promptData.versions[i];
        const versionNumber = i + 1; // Assuming versions are ordered in the JSON

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
