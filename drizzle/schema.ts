import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),

    identifier: text("identifier"),
    version: text("version"),
    provider: text("provider"),
    firstname: text("firstname"),
    status: text("status"),
    key: text("key"),
    email: text("email"),
    user: text("user"),
    requesthost: text("requesthost"),
    authstrength: text("authstrength"),
    org: text("org"),
    uniqueid: text("uniqueid"),
    name: text("name"),
    username: text("username"),
    host: text("host"),
    authorig: text("authorig"),
    displayname: text("displayname"),
  },
  (users) => ({
    uniqueidIndex: uniqueIndex("uniqueid").on(users.uniqueid),
  }),
);

export const legacyIdentities = sqliteTable(
  "legacy_identities",
  {
    id: integer("id").primaryKey(),

    identifier: text("identifier"),
    email: text("email"),
  },
  (legacyIdentity) => ({
    identifierIndxe: uniqueIndex("identifier").on(legacyIdentity.identifier),
  }),
);
