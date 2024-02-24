import { v } from "convex/values";
import { actionWithAuth, queryWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";
import OpenAI from "openai";
import { internalMutation } from "../_generated/server";
import { StorageActionWriter } from "convex/server";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { ImageGenerateParams } from "openai/resources";

export const list = queryWithAuth({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    validateAdminSession(ctx.session);

    const images = await ctx.db
      .query("images")
      .withIndex("by_exercise_id", (q) => q.eq("exerciseId", args.exerciseId))
      .collect();

    const result = [];

    for (const image of images) {
      const resultThumbnails = [];
      for (const thumbnail of image.thumbnails) {
        const thumbnailSrc = await ctx.storage.getUrl(thumbnail.storageId);
        if (!thumbnailSrc) continue;

        resultThumbnails.push({
          ...thumbnail,
          src: thumbnailSrc,
        });
      }

      const src = await ctx.storage.getUrl(image.storageId);
      if (!src) continue;

      result.push({
        ...image,
        thumbnails: resultThumbnails,
        src,
      });
    }

    return result;
  },
});

export const generate = actionWithAuth({
  args: {
    prompt: v.string(),
    exerciseId: v.id("exercises"),
  },
  handler: async (
    { storage, session, runMutation },
    { prompt, exerciseId },
  ) => {
    validateAdminSession(session);

    const model: ImageGenerateParams["model"] = "dall-e-3";
    const size: ImageGenerateParams["size"] = "1792x1024";
    const quality: ImageGenerateParams["quality"] = "hd";

    const openai = new OpenAI();
    const opanaiResponse = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality,
    });
    const imageUrl = opanaiResponse.data[0].url!;

    const blob = await (await fetch(imageUrl)).blob();
    const storageId = await storage.store(blob);

    const imageId: Id<"images"> = await runMutation(
      internal.admin.image.store,
      {
        storageId,
        thumbnails: [
          await generateThumbnail(imageUrl, storage, "image/avif"),
          await generateThumbnail(imageUrl, storage, "image/webp"),
          await generateThumbnail(imageUrl, storage, "image/jpeg"),
        ],
        model,
        size,
        quality,
        exerciseId,
        prompt,
      },
    );

    return imageId;
  },
});

export const store = internalMutation({
  args: {
    storageId: v.id("_storage"),
    thumbnails: v.array(
      v.object({
        type: v.string(),
        storageId: v.id("_storage"),
        sizes: v.optional(v.string()),
      }),
    ),
    model: v.string(),
    size: v.string(),
    prompt: v.string(),
    quality: v.union(v.literal("standard"), v.literal("hd")),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, row) => {
    return await ctx.db.insert("images", row);
  },
});

async function generateThumbnail(
  url: string,
  storage: StorageActionWriter,
  type: "image/webp" | "image/avif" | "image/jpeg",
) {
  const res = await fetch("https://cs250.epfl.ch/admin/compress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: "5570f676-ddbb-415b-939b-c1adf66fc4fc",
      url,
      format:
        type === "image/webp"
          ? "webp"
          : type === "image/avif"
            ? "avif"
            : "jpeg",
      width: 500,
    }),
  });
  const blob = await res.blob();
  const storageId = await storage.store(blob);

  return {
    type,
    storageId,
  };
}
