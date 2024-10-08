import { v } from "convex/values";
import {
  ActionCtx,
  internalMutation,
  internalQuery,
} from "../../_generated/server";
import {
  ConvexMutationAdapter,
  mapDbSession,
  mapDbUser,
} from "./ConvexMutationAdapter";
import { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import { internal } from "../../_generated/api";

export class ConvexActionAdapter implements Adapter {
  constructor(private ctx: ActionCtx) {}

  async getSessionAndUser(
    sessionId: string,
  ): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const result = await this.ctx.runQuery(
      // @ts-ignore
      internal.auth.adapters.ConvexActionAdapter.getSessionAndUser,
      {
        sessionId,
      },
    );

    if (result === null) {
      return [null, null];
    }

    const { rawSession, rawUser } = result;
    return [mapDbSession(rawSession), mapDbUser(rawUser)];
  }

  async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    const results = await this.ctx.runQuery(
      internal.auth.adapters.ConvexActionAdapter.getUserSessions,
      {
        userId,
      },
    );

    return results.map(mapDbSession);
  }

  async setSession(session: DatabaseSession): Promise<void> {
    await this.ctx.runMutation(
      internal.auth.adapters.ConvexActionAdapter.setSession,
      {
        userId: session.userId,
        id: session.id,
        expiresAt: +session.expiresAt,
      },
    );
  }

  async updateSessionExpiration(
    sessionId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.ctx.runMutation(
      internal.auth.adapters.ConvexActionAdapter.updateSessionExpiration,
      {
        sessionId,
        expiresAt: +expiresAt,
      },
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.ctx.runMutation(
      internal.auth.adapters.ConvexActionAdapter.deleteSession,
      {
        sessionId,
      },
    );
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.ctx.runMutation(
      internal.auth.adapters.ConvexActionAdapter.deleteUserSessions,
      {
        userId,
      },
    );
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.ctx.runMutation(
      internal.auth.adapters.ConvexActionAdapter.deleteExpiredSessions,
      {},
    );
  }
}

export const getSessionAndUser = internalQuery({
  args: {
    sessionId: v.string(),
  },
  handler: async ({ db }, { sessionId }) => {
    const rawSession = await db
      .query("sessions")
      .withIndex("by_lucia_id", (q) => q.eq("id", sessionId))
      .first();
    if (rawSession === null) {
      return null;
    }

    const rawUser = await db
      .query("users")
      .withIndex("by_lucia_id", (q) => q.eq("id", rawSession.userId))
      .first();
    if (rawUser === null) {
      return null;
    }

    return { rawSession, rawUser };
  },
});

export const getUserSessions = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    return await db
      .query("sessions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const setSession = internalMutation({
  args: {
    userId: v.string(),
    expiresAt: v.number(),
    id: v.string(),
  },
  handler: async ({ db }, row) => {
    await db.insert("sessions", row);
  },
});

export const updateSessionExpiration = internalMutation({
  args: {
    sessionId: v.string(),
    expiresAt: v.number(),
  },
  handler: async ({ db }, { sessionId, expiresAt }) => {
    await new ConvexMutationAdapter(db).updateSessionExpiration(
      sessionId,
      new Date(expiresAt),
    );
  },
});

export const deleteSession = internalMutation({
  args: {
    sessionId: v.string(),
  },
  handler: async ({ db }, { sessionId }) => {
    await new ConvexMutationAdapter(db).deleteSession(sessionId);
  },
});

export const deleteUserSessions = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    await new ConvexMutationAdapter(db).deleteUserSessions(userId);
  },
});

export const deleteExpiredSessions = internalMutation({
  args: {},
  handler: async ({ db }) => {
    await new ConvexMutationAdapter(db).deleteExpiredSessions();
  },
});
