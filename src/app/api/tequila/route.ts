import ServerSideFlow from "@/tequila/serverSideFlow";
import { getIdentifier } from "@/util/crypto";
import * as jsrsasign from "jsrsasign";
import { db } from "../../../../drizzle/db";
import { users } from "../../../../drizzle/schema";

export const dynamic = "force-dynamic"; // defaults to auto

interface TequilaFields {
  version: string;
  provider: string;
  firstname: string;
  status: string;
  key: string;
  email: string;
  user: string;
  requesthost: string;
  authstrength: string;
  org: string;
  uniqueid: string;
  name: string;
  username: string;
  host: string;
  authorig: string;
  displayname: string;
}

export async function GET(req: Request) {
  const flow = new ServerSideFlow({
    service: "CS-250",
    request: [
      "uniqueid", // SCIPER
      "email",
      "username",
      "name",
      "firstname",
      "displayname",
      // "unitresp",
      // "group",
      // "allunits",
      // "unit",
      // "where",
      // "wheres",
      // "statut",
      // "authstrength",
      // "camiprocardid",
    ],
    redirectUrl:
      (process.env.BASE_URL ?? "http://localhost:3000") + "/tequilaRedirect",
  });

  const key = new URL(req.url).searchParams.get("key");
  const authCheck = new URL(req.url).searchParams.get("auth_check");
  if (!key || !authCheck) {
    try {
      return Response.json({ ok: true, redirect: await flow.prepareLogin() });
    } catch (e) {
      console.log("Error: " + e);
      return Response.json({ ok: false, error: "tequila" });
    }
  }

  let identity;
  try {
    identity = (await flow.validateTequilaReturn(
      key,
      authCheck,
    )) as TequilaFields;
  } catch (e) {
    console.log("Error: " + e);
    return Response.json({ ok: false, error: "tequila" });
  }

  const { email, uniqueid, displayname: displayName } = identity;
  const accountIdentifier = email ? email : uniqueid;
  const identifier = getIdentifier(accountIdentifier);

  await db
    .insert(users)
    .values({
      identifier,
      ...identity,
    })
    .onConflictDoNothing({ target: users.uniqueid });

  const jwtKey = process.env.JWT_KEY;
  if (!jwtKey) {
    console.log("Missing JWT key");
    return Response.json({ ok: false, error: "config2" });
  }

  const jwt = jsrsasign.KJUR.jws.JWS.sign(
    null,
    { alg: "RS256" },
    {
      iss: "https://cs250.epfl.ch",
      iat: jsrsasign.KJUR.jws.IntDate.get("now"),
      exp: jsrsasign.KJUR.jws.IntDate.get("now + 1hour"),
      sub: identifier,
    },
    jwtKey,
  );

  return Response.json({
    ok: true,
    identity: {
      name: displayName,
      email,
    },
    jwt,
  });
}
