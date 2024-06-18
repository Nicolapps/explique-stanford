import { validateAdminRequest } from "@/util/admin";
import { getIdentifier } from "@/util/crypto";
import { legacyIdentities } from "../../../../../drizzle/schema";
import { db } from "../../../../../drizzle/db";

/**
 * Computes the identifier for a given email address
 * (requires an admin JWT token)
 */
export async function GET(req: Request) {
  const adminError = validateAdminRequest(req);
  if (adminError !== null) return adminError;

  const emails = new URL(req.url).searchParams.get("for") ?? "";
  if (!emails) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const values = emails
    .split(",")
    .filter((e) => e.trim() !== "")
    .map((email) => ({ email, identifier: getIdentifier(email) }));

  await db
    .insert(legacyIdentities)
    .values(values)
    .onConflictDoNothing({ target: legacyIdentities.identifier });

  return Response.json(values.map((r) => r.identifier));
}
