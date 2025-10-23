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

    // 1. Correct data extraction: Expect data in req.body.prompts
    const importedData = req.body.prompts;

    if (!Array.isArray(importedData)) {
      res.status(400).json({ success: false, message: "Invalid data format. Expected a 'prompts' array key in the body." });
      return;
    }

    const createdPrompts = [];
    let createdVersionCount = 0;

    for (const promptData of importedData) {
      // Validate prompt structure
      if (!promptData.title || !promptData.versions || !Array.isArray(promptData.versions) || promptData.versions.length === 0) {
        console.warn("Skipping invalid prompt data (Missing title or versions):", promptData);
        continue;
      }

      // 2. Create the main Prompt entry
      const newPrompt = await Prompt.create({
        userId: new mongoose.Types.ObjectId(userId.toString()),
        title: promptData.title.trim(),
        isDeleted: promptData.isDeleted || false,
      });

      // 3. Create all associated versions
      for (let i = 0; i < promptData.versions.length; i++) {
        const versionData = promptData.versions[i];
        const versionNumber = i + 1;

        // Basic validation for version data
        if (!versionData.title || !versionData.description) {
          console.warn(`Skipping invalid version data for prompt ${newPrompt.title} (Missing title or description):`, versionData);
          continue;
        }

        // --- 🎯 CORE LOGIC FIXES ---

        // 4. Determine event type ('create' for version 1, 'update' for others)
        const event = versionNumber === 1 ? 'create' : 'update';

        // 5. Map current version data to the 'afterObject'
        const afterObject = {
            title: versionData.title.trim(),
            description: versionData.description,
            // Mapping 'tage' from JSON to the 'tags' array field in the schema
            tags: Array.isArray(versionData.tage) ? versionData.tage : [],
        };

        // 6. Conditionally set the 'beforeObject' (for 'update' events)
        let beforeObject = null;
        if (event === 'update' && i > 0) {
            const previousVersionData = promptData.versions[i - 1];
            // Ensure previous version data exists before setting beforeObject
            if (previousVersionData) {
                beforeObject = {
                    title: previousVersionData.title.trim(),
                    description: previousVersionData.description,
                    tags: Array.isArray(previousVersionData.tage) ? previousVersionData.tage : [],
                };
            }
        }

        // 7. Create the PromptVersion document
        await PromptVersion.create({
          promptId: newPrompt._id,
          versionNumber: versionNumber,
          event: event,
          beforeObject: beforeObject, // Null for 'create', previous version for 'update'
          afterObject: afterObject,   // The current version content
        });
        createdVersionCount++;
      }
      createdPrompts.push(newPrompt._id);
    }

    res.status(201).json({
      success: true,
      message: "Prompts imported successfully.",
      data: {
        createdPromptIds: createdPrompts,
        createdVersionCount: createdVersionCount,
      },
    });

  } catch (error) {
    console.error("❌ Error importing prompts:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      // Return specific validation errors (like the 'event is required' error)
      const messages = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({ success: false, message: "Validation failed during import", errors: messages });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error during import" });
  }
};
