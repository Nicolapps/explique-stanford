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
