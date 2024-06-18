import { ConvexError, v } from "convex/values";
import { getCourseRegistration } from "../courses";
import { mutationWithAuth } from "../auth/withAuth";
import { Id } from "../_generated/dataModel";
import { DatabaseWriter } from "../_generated/server";
import { generateUserId } from "../auth/lucia";

async function findOrCreateUserByEmail(
  db: DatabaseWriter,
  email: string,
): Promise<Id<"users">> {
  const user = await db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
  return user
    ? user._id
    : await db.insert("users", { id: generateUserId(), email, name: null });
}

async function findOrCreateUserByIdentifier(
  db: DatabaseWriter,
  identifier: string,
): Promise<Id<"users">> {
  const user = await db
    .query("users")
    .withIndex("byIdentifier", (q) => q.eq("identifier", identifier))
    .first();
  return user
    ? user._id
    : await db.insert("users", {
        id: generateUserId(),
        identifier,
        email: null,
        name: null,
      });
}

export default mutationWithAuth({
  args: {
    courseSlug: v.string(),
    users: v.union(
      v.object({
        emails: v.array(v.string()),
      }),
      v.object({
        identifiers: v.array(v.string()),
      }),
    ),
  },
  handler: async ({ db, session }, { courseSlug, users }) => {
    const { course } = await getCourseRegistration(
      db,
      session,
      courseSlug,
      "admin",
    );

    const userIds = [];

    if ("emails" in users) {
      for (const email of users.emails) {
        userIds.push(await findOrCreateUserByEmail(db, email));
      }
    }
    if ("identifiers" in users) {
      for (const identifier of users.identifiers) {
        userIds.push(await findOrCreateUserByIdentifier(db, identifier));
      }
    }

    let added = 0;
    let ignored = 0;

    for (const userId of userIds) {
      const existing = await db
        .query("registrations")
        .withIndex("by_user_and_course", (q) =>
          q.eq("userId", userId).eq("courseId", course._id),
        )
        .first();
      if (!existing) {
        await db.insert("registrations", {
          userId,
          courseId: course._id,
          role: null,
          completedExercises: [],
        });
        added++;
      } else {
        ignored++;
      }
    }

    return { added, ignored };
  },
});
