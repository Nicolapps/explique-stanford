import * as jsrsasign from "jsrsasign";

export function validateAdminRequest(req: Request): Response | null {
  const publicKey = process.env.ADMIN_API_PUBLIC_KEY;
  if (!publicKey) {
    console.error("Configuration issue: ADMIN_API_PUBLIC_KEY is not set");
    return Response.json(
      { error: "Configuration issue (f4986905-cad2-48bc-b0ae-70b0ee594ec)" },
      { status: 500 },
    );
  }

  const token = req.headers.get("Authorization");
  if (!token) {
    return Response.json({ error: "No token provided" }, { status: 401 });
  }

  const jwt = token.replace(/^Bearer /, "");
  const verify = jsrsasign.KJUR.jws.JWS.verifyJWT(jwt, publicKey, {
    alg: ["RS256"],
    iss: ["https://cs250.epfl.ch"],
    aud: ["admin"],
  });
  if (!verify) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  return null;
}
