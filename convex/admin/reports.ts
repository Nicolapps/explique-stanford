import { v } from "convex/values";
import { queryWithAuth } from "../auth/withAuth";
import { getCourseRegistration } from "../courses";

export const list = queryWithAuth({
  args: {
    courseSlug: v.string(),
  },
  handler: async ({ db, session }, { courseSlug }) => {
    const { course } = await getCourseRegistration(
      db,
      session,
      courseSlug,
      "admin",
    );

    const reports = await db
      .query("reports")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();

    const result = [];
    for (const report of reports) {
      const message = await db.get(report.messageId);

      result.push({
        id: report._id,
        attemptId: report.attemptId,
        messageId: report.messageId,
        message: message?.content,
        reason: report.reason,
      });
    }

    return result;
  },
});
