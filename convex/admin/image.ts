import { v } from "convex/values";
import { actionWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";
import OpenAI from "openai";

export const generate = actionWithAuth({
  args: {
    prompt: v.string(),
  },
  handler: async ({ storage, session }, { prompt }) => {
    validateAdminSession(session);

    const openai = new OpenAI();
    const opanaiResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    const dallEImageUrl = opanaiResponse.data[0].url!;

    const imageResponse = await fetch(dallEImageUrl);
    const image = await imageResponse.blob();
    const storageId = await storage.store(image);
    return await storage.getUrl(storageId);
  },
});
