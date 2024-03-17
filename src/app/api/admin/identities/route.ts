import { db } from "../../../../../drizzle/db";

// Disable prerendering
export async function getServerSideProps() {
  return { props: {} };
}

export async function GET(req: Request) {
  // TODO Gate this API

  const rows = await db.query.users.findMany({
    columns: {
      identifier: true,
      email: true,
    },
  });

  const results: Record<
    string,
    {
      email: string;
    }
  > = Object.fromEntries(
    rows.map((row) => [
      row.identifier,
      {
        ...row,
        identifier: undefined,
      },
    ]),
  );

  return Response.json(results);
}
