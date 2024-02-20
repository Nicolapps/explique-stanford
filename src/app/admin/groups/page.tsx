"use client";

import { useQuery } from "@/usingSession";
import { api } from "../../../../convex/_generated/api";
import Title from "@/components/typography";

export default function GroupsPage() {
  const stats = useQuery(api.admin.groupAssignment.stats, {});

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <Title>Groups</Title>

        {stats && (
          <>
            <h2 className="text-lg mt-8 mb-2 font-medium">
              Initial assignments
            </h2>

            <p className="prose">
              <strong>{stats.evenlyAssigned.total}</strong> students were
              automatically imported from IS-Academia. Out of them,{" "}
              <strong>{stats.evenlyAssigned.A}</strong> were assigned to group A
              and <strong>{stats.evenlyAssigned.B}</strong> were assigned to
              group B.
            </p>

            {stats.assignmentChanged.length > 0 && (
              <>
                <h2 className="text-lg mt-8 mb-2 font-medium">
                  Non-matching assignments
                </h2>

                <p className="prose">
                  The following students are in a group which does do not match
                  their initial assignment.
                </p>

                <Table rows={stats.assignmentChanged} />
              </>
            )}

            {stats.randomAssigned.length > 0 && (
              <>
                <h2 className="text-lg mt-8 mb-2 font-medium">
                  Random assignments
                </h2>

                <p className="prose">
                  The following students were assigned to a group randomly
                  because they were not imported from IS-Academia when they
                  first logged in to the platform. They don’t count in the even
                  distribution of groups.
                </p>

                <Table rows={stats.randomAssigned} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Table({
  rows,
}: {
  rows: {
    email: string;
    group: string;
    isAdmin?: boolean;
    earlyAccess?: boolean;
  }[];
}) {
  return (
    <table className="divide-y divide-slate-300 w-full">
      <thead>
        <tr>
          <th
            scope="col"
            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
          >
            Email
          </th>
          <th
            scope="col"
            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            Currently assigned group
          </th>
          <th
            scope="col"
            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            Admin
          </th>
          <th
            scope="col"
            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            TA
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {rows.map((student) => (
          <tr key={student.email}>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
              {student.email}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {student.group}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {student.isAdmin ? "✅" : "❌"}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {student.earlyAccess ? "✅" : "❌"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
