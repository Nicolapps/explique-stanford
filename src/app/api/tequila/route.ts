import ServerSideFlow from "@/tequila/serverSideFlow";

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
      return Response.json({ ok: true, identity });
    } else {
      return Response.json({ ok: true, redirect: await flow.prepareLogin() });
    }
  } catch (e) {
    console.log("Error: " + e);
    return Response.json({ ok: false });
  }
}
