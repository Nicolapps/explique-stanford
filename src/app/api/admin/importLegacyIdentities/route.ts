import { getIdentifier } from "@/util/crypto";
import { db } from "../../../../../drizzle/db";
import { legacyIdentities } from "../../../../../drizzle/schema";

export async function POST(req: Request) {
  const bodyAsJson = await req.json();
  if (!Array.isArray(bodyAsJson)) {
    return new Response("Expected an array of emails", { status: 400 });
  }

  for (const email of bodyAsJson) {
    if (typeof email !== "string") {
      return new Response("Expected a string", { status: 400 });
    }

    await db
      .insert(legacyIdentities)
      .values({
        email,
        identifier: getIdentifier(email),
      })
      .onConflictDoNothing({ target: legacyIdentities.identifier });
  }

  return new Response(null, { status: 201 });
}
