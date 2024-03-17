import { ConvexError } from "convex/values";
import { queryWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";
import * as jsrsasign from "jsrsasign";

export default queryWithAuth({
  args: {},
  handler: async ({ session }, {}) => {
    validateAdminSession(session);
    if (!session) {
      throw new ConvexError("Invariant broken");
    }

    const jwtKey = process.env.ADMIN_API_PRIVATE_KEY;
    if (!jwtKey) {
      console.log("Missing ADMIN_API_PRIVATE_KEY key");
      throw new ConvexError("Configuration issue");
    }

    const jwt = jsrsasign.KJUR.jws.JWS.sign(
      null,
      { alg: "RS256" },
      {
        iss: "https://cs250.epfl.ch",
        iat: jsrsasign.KJUR.jws.IntDate.get("now"),
        exp: jsrsasign.KJUR.jws.IntDate.get("now + 1hour"),
        sub: session.user.identifier,
        aud: "admin",
      },
      jwtKey,
    );

    return jwt;
  },
});
