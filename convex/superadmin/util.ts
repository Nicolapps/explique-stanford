import { ConvexError } from "convex/values";
import { Session } from "../auth/withAuth";

export function validateSuperadminSession(session: Session | null) {
  if (!session) throw new ConvexError("Not logged in");
  if (!session.user.superadmin) {
    throw new ConvexError("You don’t have permission to access this page.");
  }
}
