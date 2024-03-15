import ServerSideFlow from "@/tequila/serverSideFlow";
import * as jsrsasign from "jsrsasign";
const { createHash } = require("crypto");

export const dynamic = "force-dynamic"; // defaults to auto

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

  try {
    const key = new URL(req.url).searchParams.get("key");
    const authCheck = new URL(req.url).searchParams.get("auth_check");

    if (key && authCheck) {
      const identity = await flow.validateTequilaReturn(key, authCheck);

      const { email, uniqueid } = identity;
      const accountIdentifier = email ? email : uniqueid;

      const salt = process.env.IDENTIFIER_SALT;
      if (!salt) {
        console.log("Missing salt configuration");
        return Response.json({ ok: false, error: "config1" });
      }
      const identifier = createHash("sha256")
        .update(salt + accountIdentifier)
        .digest("base64");

      const jwtKey = process.env.JWT_KEY;
      if (!salt) {
        console.log("Missing JWT key");
        return Response.json({ ok: false, error: "config2" });
      }

      const jwt = jsrsasign.KJUR.jws.JWS.sign(
        null,
        { alg: "ES256" },
        {
          iss: "https://cs250.epfl.ch",
          iat: jsrsasign.KJUR.jws.IntDate.get("now"),
          exp: jsrsasign.KJUR.jws.IntDate.get("now + 1hour"),
          sub: identifier,
        },
        jwtKey,
      );

      return Response.json({ ok: true, identity, jwt });
    } else {
      return Response.json({ ok: true, redirect: await flow.prepareLogin() });
    }
  } catch (e) {
    console.log("Error: " + e);
    return Response.json({ ok: false, error: "tequila" });
  }
}
