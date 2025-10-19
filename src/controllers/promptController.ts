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
			isDeleted: false,
		});

		// Create the initial version record
		await PromptVersion.create({
			promptId: newPrompt._id,
			event: 'create',
			beforeObject: null,
			afterObject: {
				title: trimmedTitle,
				description: trimmedDescription,
				tags: cleanTags,
			},
			versionNumber: 1,
		});

		res.status(201).json({
		success: true,
		message: "Prompt created successfully.",
		data: {
      promptId: newPrompt._id,
      isDeleted: newPrompt.isDeleted,
      createdAt: newPrompt.createdAt,
      version: {
        title: trimmedTitle,
        description: trimmedDescription,
        tags: cleanTags,
        versionNumber: 1,
      },
    }, 
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
		console.error('❌ Internal Server error', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}

export const updatePrompt = async (req: AuthRequest, res: Response ): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const promptId = req.params.promptId;
    const { title, description, tags } = req.body;

    // Fetch the prompt
    const prompt = await Prompt.findById(promptId);
    if (!prompt || prompt.isDeleted) {
      res.status(404).json({ success: false, message: "Prompt not found." });
      return;
    }

    // Check ownership
    if (prompt.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Forbidden. Not your prompt." });
      return;
    }

    // Basic validation
    if (!title || !description) {
      res.status(400).json({ success: false, message: "Title and description are required." });
      return;
    }

	  //Basic validation for tags
    if (tags && (!Array.isArray(tags) || tags.some((t) => typeof t !== "string"))) {
      res.status(400).json({ success: false, message: "Tags must be an array of strings." });
      return;
    }

    // Trim inputs
    const trimmedTitle = title?.trim();
    const trimmedDescription = description?.trim();
    const cleanTags = (tags || []).map((t: string) => t.trim());

     // Fetch the latest version
    const latestVersion = await PromptVersion.findOne({ promptId })
      .sort({ versionNumber: -1 })
      .lean();

    // Check if there is any change
    const hasChanged =
      !latestVersion ||
      trimmedTitle !== latestVersion.afterObject?.title ||
      trimmedDescription !== latestVersion.afterObject?.description ||
      JSON.stringify(cleanTags) !== JSON.stringify(latestVersion.afterObject?.tags);

    if (!hasChanged) {
      res.status(200).json({ 
        success: true, 
        message: "No changes detected.", 
        data: latestVersion?.afterObject || {}, 
      });
      return;
    }

    // Save old state for versioning
    const beforeObject = latestVersion?.afterObject ?? null;
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create new version record
    const newVersion = await PromptVersion.create({
      promptId: prompt._id,
      event: "update",
      beforeObject,
      afterObject: {
        title: trimmedTitle,
        description: trimmedDescription,
        tags: cleanTags,
      },
      versionNumber: newVersionNumber,
    });

    res.status(200).json({
      success: true,
      message: "Prompt updated successfully.",
      data: newVersion.afterObject,
    });

  } catch (error) {
    console.error("❌ Internal Server error", error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ message: "Validation failed", errors: messages });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const promptId = req.params.promptId;

    // Check if the prompt exists
    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      res.status(404).json({ success: false, message: "Prompt not found." });
      return;
    }

    // Check ownership
    if (prompt.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Forbidden. Not your prompt." });
      return;
    }

    // Delete all associated PromptVersions
    await PromptVersion.deleteMany({ promptId: prompt._id });

    // Delete the prompt itself
    await Prompt.findByIdAndDelete(prompt._id);

    res.status(200).json({
      success: true,
      message: "Prompt and all associated versions deleted successfully.",
    });

  } catch (error) {
    console.error("❌ Internal Server error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archivePrompt = async (req: AuthRequest, res: Response) : Promise<void> => {
	try{
		if (!req.user || !req.user._id) {
		res.status(401).json({ success: false, message: "Unauthorized" });
		return;
		}

		const promptId = req.params.promptId;

		// Check if the prompt exists
		const prompt = await Prompt.findById(promptId);
		if (!prompt) {
		res.status(404).json({ success: false, message: "Prompt not found." });
		return;
		}

		// Check ownership
		if (prompt.userId.toString() !== req.user._id.toString()) {
		res.status(403).json({ success: false, message: "Forbidden. Not your prompt." });
		return;
		}

		// If already archived
		if (prompt.isDeleted) {
		res.status(200).json({ success: true, message: "Prompt is already archived." });
		return;
		}

		// Archive the prompt
		prompt.isDeleted = true;
		await prompt.save();

		res.status(200).json({
		success: true,
		message: "Prompt archived successfully.",
		data: prompt,
		});
	}
	catch(error: any){
		console.error("❌ Internal Server error:", error);
		if (error instanceof mongoose.Error.ValidationError) {
		const messages = Object.values(error.errors).map((val) => val.message);
		res.status(400).json({ message: "Validation failed", errors: messages });
		return;
		}
		res.status(500).json({ message: "Internal server error" });
	}
}

export const getPromptWithLatestVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { search, tag, isDeleted } = req.query;

    // filter prompts by user and isDeleted
    const promptFilter: any = { userId };
    promptFilter.isDeleted = isDeleted === "true";

    // fetch prompts
    const prompts = await Prompt.find(promptFilter).sort({ updatedAt: -1 });

    // Fetch latest version for each prompt
    const promptsWithVersion = await Promise.all(
      prompts.map(async (prompt) => {
        const latestVersion = await PromptVersion.findOne({ promptId: prompt._id })
          .sort({ versionNumber: -1 })
          .lean();

        return {
          _id: prompt._id,
          userId: prompt.userId,
          isDeleted: prompt.isDeleted,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt,
          version: latestVersion?.afterObject ?? null,
        };
      })
    );

    // filter by search or tag on the latest version
    const filtered = promptsWithVersion.filter((p) => {
      const v = p.version;
      if (!v) return false;

      let matches = true;

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        matches =
          v.title.toLowerCase().includes(s) ||
          v.description.toLowerCase().includes(s);
      }

      if (matches && tag && typeof tag === "string") {
        matches = v.tags?.includes(tag) ?? false;
      }

      return matches;
    });

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });

  } catch (error) {
    console.error("❌ Error fetching prompts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPromptWithAllVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const promptId = req.params.promptId;

    // Validate promptId format
    if (!mongoose.Types.ObjectId.isValid(promptId)) {
      res.status(400).json({ success: false, message: "Invalid prompt ID" });
      return;
    }

    // Find the prompt that belongs to the user and is not deleted
    const prompt = await Prompt.findOne({
      _id: promptId,
      userId: req.user._id,
      isDeleted: false,
    }).lean();

    if (!prompt) {
      res.status(404).json({ success: false, message: "Prompt not found or archived." });
      return;
    }

    // Fetch all associated versions sorted by versionNumber
    const versions = await PromptVersion.find({ promptId })
      .sort({ versionNumber: 1 })
      .select("-__v -updatedAt")
      .lean();

    // Latest version
    const latestVersion = versions.length ? versions[versions.length - 1].afterObject : null;

    res.status(200).json({
      success: true,
      message: "Prompt and its versions fetched successfully.",
      data: {
        prompt: {
          _id: prompt._id,
          userId: prompt.userId,
          isDeleted: prompt.isDeleted,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt,
          lastestVersion: latestVersion,
        },
        versions,
      },
    });

  } catch (error) {
    console.error("❌ Error fetching prompt with versions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const restorePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const promptId = req.params.promptId;

    // Validate prompt ID format
    if (!mongoose.Types.ObjectId.isValid(promptId)) {
      res.status(400).json({ success: false, message: "Invalid prompt ID" });
      return;
    }

    // Find the prompt that belongs to the user
    const prompt = await Prompt.findOne({
      _id: promptId,
      userId: req.user._id,
    });

    if (!prompt) {
      res.status(404).json({ success: false, message: "Prompt not found." });
      return;
    }

    // Check if it's already archived
    if (!prompt.isDeleted) {
      res.status(200).json({ success: true, message: "Prompt already active." });
      return;
    }

    // Remove it from archieved
    prompt.isDeleted = false;
    await prompt.save();

    res.status(200).json({
      success: true,
      message: "Prompt restored successfully.",
      data: prompt,
    });

  } catch (error) {
    console.error("❌ Error archiving prompt:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllUserPrompts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const isDeleted = req.query.isDeleted === "true";
    const search = (req.query.search as string)?.trim() || "";

    // Base filter for user's prompts
    const baseFilter: any = { userId, isDeleted };

    let prompts;

    if (search) {
      const regex = new RegExp(search, "i");

      // Step 1️⃣: Find prompts that match directly by title or tags
      const directMatches = await Prompt.find({
        ...baseFilter,
        $or: [
          { title: { $regex: regex } },
          { tags: { $elemMatch: { $regex: regex } } },
        ],
      }).lean();

      // Step 2️⃣: Find promptIds from versions that match the search
      const versionMatches = await PromptVersion.find({
        $or: [
          { "afterObject.title": { $regex: regex } },
          { "afterObject.tags": { $elemMatch: { $regex: regex } } },
          { "afterObject.description": { $regex: regex } }, // optional if you have this
          { "afterObject.content": { $regex: regex } }, // optional field
        ],
      })
        .distinct("promptId"); // only get unique prompt IDs

      // Step 3️⃣: Combine both prompt sets (unique by _id)
      const combinedIds = [
        ...new Set([
          ...directMatches.map((p) => p._id.toString()),
          ...versionMatches.map((id) => id.toString()),
        ]),
      ];

      // Step 4️⃣: Fetch all combined prompts for this user
      prompts = await Prompt.find({
        _id: { $in: combinedIds },
        userId,
        isDeleted,
      })
        .sort({ updatedAt: -1 })
        .lean();
    } else {
      // No search → just get by isDeleted
      prompts = await Prompt.find(baseFilter).sort({ updatedAt: -1 }).lean();
    }

    res.status(200).json({
      success: true,
      count: prompts.length,
      message: search
        ? `Prompts related to "${search}" fetched successfully.`
        : isDeleted
        ? "Archived prompts fetched successfully."
        : "Active prompts fetched successfully.",
      data: prompts,
    });
  } catch (error) {
    console.error("❌ Error fetching user prompts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};