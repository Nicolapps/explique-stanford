import {
  Adapter,
  KeySchema,
  LuciaErrorConstructor,
  SessionSchema,
  UserSchema,
  lucia,
} from "lucia";
import { AuthDbWriter } from "./authDbWriter";
import { epfl } from "./lucia_epfl";
import { google } from "@lucia-auth/oauth/providers";

type SessionId = string;
type UserId = string;
type KeyId = string;

export function getAuth(db: AuthDbWriter) {
  return lucia({
    // We cheat to allow queries to use `getAuth`
    adapter: convexAdapter(db),

    // Set the LUCIA_ENVIRONMENT variable to "PROD"
    // on your prod deployment's dashboard
    env: (process.env.LUCIA_ENVIRONMENT as "PROD" | undefined) ?? "DEV",

    getUserAttributes(user: UserSchema) {
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        earlyAccess: user.earlyAccess,
        extraTime: user.extraTime,
        group: user.group,
        researchConsent: user.researchConsent,
        completedExercises: user.completedExercises,
        identifier: user.identifier,
      };
    },

    sessionCookie: {
      expires: false,
    },
  });
}

export function getEpflAuth(db: AuthDbWriter) {
  return epfl(getAuth(db), {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      (process.env.BASE_URL ?? "http://localhost:3000") + "/authRedirect",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
  });
}

export function getGoogleAuth(db: AuthDbWriter) {
  return google(getAuth(db), {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      (process.env.BASE_URL ?? "http://localhost:3000") + "/authRedirect",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
  });
}

const convexAdapter = (db: AuthDbWriter) => {
  return (LuciaError: LuciaErrorConstructor): Adapter => ({
    async getSessionAndUser(
      sessionId: string,
    ): Promise<[SessionSchema, UserSchema] | [null, null]> {
      const session = await getSession(db, sessionId);
      if (session === null) {
        return [null, null];
      }
      const user = await getUser(db, session.user_id);
      if (user === null) {
        return [null, null];
      }
      return [session, user];
    },
    async deleteSession(sessionId: SessionId): Promise<void> {
      const session = await getSession(db, sessionId);
      if (session === null) {
        return;
      }
      await db.delete(session._id);
    },
    async deleteSessionsByUserId(userId: UserId): Promise<void> {
      const sessions = await this.getSessionsByUserId(userId);
      await Promise.all(sessions.map((session) => db.delete(session._id)));
    },
    async getSession(sessionId: SessionId): Promise<SessionSchema | null> {
      return await getSession(db, sessionId);
    },
    async getSessionsByUserId(userId: UserId): Promise<SessionSchema[]> {
      return await db.findAllByIndex({
        tableName: "sessions",
        indexName: "byUserId",
        fieldName: "user_id",
        value: userId,
      });
    },
    async setSession(session: SessionSchema): Promise<void> {
      const { _id, _creationTime, ...data } = session;
      await db.insert("sessions", data);
    },
    async deleteKeysByUserId(userId: UserId): Promise<void> {
      const keys = await db.findAllByIndex({
        tableName: "auth_keys",
        indexName: "byUserId",
        fieldName: "user_id",
        value: userId,
      });

      await Promise.all(keys.map((key) => db.delete(key._id)));
    },
    async deleteKey(keyId: KeyId): Promise<void> {
      const key = await getKey(db, keyId);
      if (key === null) {
        return;
      }
      await db.delete(key._id);
    },
    async deleteUser(userId: UserId): Promise<void> {
      const user = await getUser(db, userId);
      if (user === null) {
        return;
      }
      await db.delete(user._id);
    },
    async getKey(keyId: KeyId): Promise<KeySchema | null> {
      return await getKey(db, keyId);
    },
    async getKeysByUserId(userId: UserId): Promise<KeySchema[]> {
      return await db.findAllByIndex({
        tableName: "auth_keys",
        indexName: "byUserId",
        fieldName: "user_id",
        value: userId,
      });
    },
    async getUser(userId: UserId): Promise<UserSchema | null> {
      return await getUser(db, userId);
    },
    async setKey(key: KeySchema): Promise<void> {
      const existingKey = await this.getKey(key.id);
      if (existingKey !== null) {
        throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
      }
      const user = await this.getUser(key.user_id);
      if (user === null) {
        throw new LuciaError("AUTH_INVALID_USER_ID");
      }
      await db.insert("auth_keys", key);
    },
    async setUser(user: UserSchema, key: KeySchema | null): Promise<void> {
      const { _id, _creationTime, ...data } = user;
      await db.insert("users", data);
      if (key !== null) {
        await this.setKey(key);
      }
    },
    async updateKey(
      keyId: string,
      partialKey: Partial<KeySchema>,
    ): Promise<void> {
      const key = await getKey(db, keyId);
      if (key === null) {
        throw new LuciaError("AUTH_INVALID_KEY_ID");
      }
      await db.patch(key._id, partialKey);
    },
    async updateUser(
      userId: string,
      partialUser: Partial<UserSchema>,
    ): Promise<void> {
      const user = await getUser(db, userId);
      if (user === null) {
        throw new LuciaError("AUTH_INVALID_USER_ID");
      }
      await db.patch(user._id, partialUser);
    },
    async updateSession(
      sessionId: string,
      partialSession: Partial<SessionSchema>,
    ): Promise<void> {
      const session = await getSession(db, sessionId);
      if (session === null) {
        throw new LuciaError("AUTH_INVALID_SESSION_ID");
      }
      await db.patch(session._id, partialSession);
    },
  });
};

async function getSession(db: AuthDbWriter, sessionId: string) {
  return await db.findFirstByIndex({
    tableName: "sessions",
    indexName: "byId",
    fieldName: "id",
    value: sessionId,
  });
}

async function getUser(db: AuthDbWriter, userId: string) {
  return await db.findFirstByIndex({
    tableName: "users",
    indexName: "byId",
    fieldName: "id",
    value: userId,
  });
}

async function getKey(db: AuthDbWriter, keyId: string) {
  return await db.findFirstByIndex({
    tableName: "auth_keys",
    indexName: "byId",
    fieldName: "id",
    value: keyId,
  });
}

export type Auth = ReturnType<typeof getAuth>;
