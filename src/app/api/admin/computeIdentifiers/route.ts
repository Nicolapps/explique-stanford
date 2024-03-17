import { validateAdminRequest } from "@/util/admin";
import { getIdentifier } from "@/util/crypto";

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

  return Response.json(
    emails
      .split(",")
      .filter((e) => e.trim() !== "")
      .map((email) => getIdentifier(email)),
  );
}
