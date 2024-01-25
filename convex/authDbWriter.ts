import { DatabaseWriter, internalMutation } from "./_generated/server";
import { TableNamesInDataModel } from "convex/server";
import { DataModel, Doc } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { GenericId, v } from "convex/values";
import { internal } from "./_generated/api";

export interface AuthDbWriter {
  patch: DatabaseWriter["patch"];
  delete: DatabaseWriter["delete"];
  insert: DatabaseWriter["insert"];

  findAllByIndex<TableName extends TableNamesInDataModel<DataModel>>(param: {
    tableName: TableName;
    indexName: string;
    fieldName: string;
    value: any;
  }): Promise<Array<Doc<TableName>>>;
  findFirstByIndex<TableName extends TableNamesInDataModel<DataModel>>(param: {
    tableName: TableName;
    indexName: string;
    fieldName: string;
    value: any;
  }): Promise<Doc<TableName> | null>;
}

export function mutationAuthDbWriter(db: DatabaseWriter): AuthDbWriter {
  return {
    patch: db.patch,
    insert: db.insert,
    delete: db.delete,

    findAllByIndex: async ({ tableName, indexName, fieldName, value }) => {
      return await db
        .query(tableName)
        .withIndex(indexName, (q) => q.eq(fieldName, value))
        .collect();
    },

    findFirstByIndex: async ({ tableName, indexName, fieldName, value }) => {
      return await db
        .query(tableName)
        .withIndex(indexName, (q) => q.eq(fieldName, value))
        .first();
    },
  };
}

export const rawQuery = internalMutation({
  args: {
    table: v.string(),
    value: v.any(),
  },
  handler: async ({ db }, { table, value }) => {
    return await db.patch(
      // @ts-expect-error
      table,
      value,
    );
  },
});

export const rawPatch = internalMutation({
  args: {
    id: v.string(),
    value: v.any(),
  },
  handler: async ({ db }, { id, value }) => {
    // @ts-expect-error
    return await db.patch(id, value);
  },
});

export const rawInsert = internalMutation({
  args: {
    table: v.string(),
    value: v.any(),
  },
  handler: async ({ db }, { table, value }) => {
    // @ts-expect-error
    return await db.insert(table, value);
  },
});

export const rawDelete = internalMutation({
  args: {
    id: v.string(),
  },
  handler: async ({ db }, { id }) => {
    // @ts-expect-error
    await db.delete(id);
  },
});

export const rawFindAllByIndex = internalMutation({
  args: {
    tableName: v.string(),
    indexName: v.string(),
    fieldName: v.string(),
    value: v.any(),
  },
  handler: async ({ db }, { tableName, indexName, fieldName, value }) => {
    return await db
      // @ts-expect-error
      .query(tableName)
      // @ts-expect-error
      .withIndex(indexName, (q) => q.eq(fieldName, value))
      .collect();
  },
});

export const rawFindFirstByIndex = internalMutation({
  args: {
    tableName: v.string(),
    indexName: v.string(),
    fieldName: v.string(),
    value: v.any(),
  },
  handler: async ({ db }, { tableName, indexName, fieldName, value }) => {
    return await db
      // @ts-expect-error
      .query(tableName)
      // @ts-expect-error
      .withIndex(indexName, (q) => q.eq(fieldName, value))
      .first();
  },
});

export function actionAuthDbWriter(ctx: ActionCtx): AuthDbWriter {
  return {
    patch: async (id, value) => {
      await ctx.runMutation(internal.authDbWriter.rawPatch, { id, value });
    },
    delete: async (id) => {
      await ctx.runMutation(internal.authDbWriter.rawDelete, { id });
    },
    insert: async (table, value) => {
      const id = await ctx.runMutation(internal.authDbWriter.rawInsert, {
        table,
        value,
      });
      return id as GenericId<typeof table>;
    },
    // @ts-expect-error
    findAllByIndex: async ({ tableName, indexName, fieldName, value }) => {
      return await ctx.runMutation(internal.authDbWriter.rawFindAllByIndex, {
        tableName,
        indexName,
        fieldName,
        value,
      });
    },
    // @ts-expect-error
    findFirstByIndex: async ({ tableName, indexName, fieldName, value }) => {
      return await ctx.runMutation(internal.authDbWriter.rawFindFirstByIndex, {
        tableName,
        indexName,
        fieldName,
        value,
      });
    },
  };
}
