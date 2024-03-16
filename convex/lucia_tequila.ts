import { ConvexError } from "convex/values";
import { DatabaseReader, DatabaseWriter } from "./_generated/server";
import { GlobalDatabaseUserAttributes, LuciaError, User } from "lucia";
import { getAuth } from "./lucia";
import { mutationAuthDbWriter } from "./authDbWriter";
import { Doc, Id } from "./_generated/dataModel";

const PROVIDER_ID = "tequila";

export function validateToken(jwt: string): string | false {
  const jwtKey = process.env.JWT_PUBLIC_KEY;
  if (!jwtKey) {
    console.error("Configuration issue: JWT_PUBLIC_KEY is not set");
    return false;
  }

  const verify = jsrsasign.KJUR.jws.JWS.verifyJWT(jwt, jwtKey, {
    alg: ["RS256"],
    iss: ["https://cs250.epfl.ch"],
  });
  if (!verify) {
    return false;
  }

  const jwtPayload = jsrsasign.KJUR.jws.JWS.readSafeJSONString(
    jsrsasign.b64utoutf8(jwt.split(".")[1]),
  );
  if (!jwtPayload) {
    console.error("Invalid JWT: can’t read the payload");
    return false;
  }

  const sub =
    "sub" in jwtPayload && typeof jwtPayload.sub === "string"
      ? jwtPayload.sub
      : null;
  if (!sub) {
    console.error("Invalid JWT: can’t read the subject");
    return false;
  }

  return sub;
}

async function getExistingUser(
  identfier: string,
  db: DatabaseWriter,
): Promise<User | null> {
  const auth = getAuth(mutationAuthDbWriter(db));

  try {
    const key = await auth.useKey(PROVIDER_ID, identfier, null);
    const user = await auth.getUser(key.userId);
    return user;
  } catch (e) {
    const error = e as Partial<LuciaError>;
    if (error?.message !== "AUTH_INVALID_KEY_ID") throw e;
    return null;
  }
}

async function createUser(
  identifier: string,
  db: DatabaseWriter,
  attributes: GlobalDatabaseUserAttributes,
): Promise<User> {
  const auth = getAuth(mutationAuthDbWriter(db));

  const user = await auth.createUser({
    key: {
      providerId: PROVIDER_ID,
      providerUserId: identifier,
      password: null,
    },
    attributes,
  });
  return user;
}

export async function getOrCreateUser(
  identifier: string,
  db: DatabaseWriter,
): Promise<User> {
  const existingUser = await getExistingUser(identifier, db);
  if (existingUser) return existingUser;

  const user = await createUser(identifier, db, {
    name: "", // @TODO(Tequila) Allow null names
    email: "", // @TODO(Tequila) Allow null names
    group: "A", // @TODO(Tequila) Use correct group assignment
    isAdmin: false,
    researchConsent: /*researchConsent ? true : undefined*/ undefined, // @TODO(Tequila) Use correct research consent
    completedExercises: [],

    // These will be filled out by Convex
    _id: "" as Id<"users">,
    _creationTime: 0,
  });
  return user;
}
