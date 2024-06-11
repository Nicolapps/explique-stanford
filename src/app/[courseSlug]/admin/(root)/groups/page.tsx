"use client";

import { useQuery } from "@/usingSession";
import { api } from "../../../../../../convex/_generated/api";
import Title from "@/components/typography";
import { Identities, useIdentities } from "@/hooks/useIdentities";
import { useCourseSlug } from "@/hooks/useCourseSlug";

export default function GroupsPage() {
  const courseSlug = useCourseSlug();
  const stats = useQuery(api.admin.groupAssignment.stats, { courseSlug });
  const identities = useIdentities();

  return (
    <>
      <Title>Groups</Title>

      {stats && identities && (
        <>
          <h2 className="text-lg mt-8 mb-2 font-medium">Initial assignments</h2>

          <p className="prose">
            <strong>{stats.evenlyAssigned.total}</strong> students were
            automatically imported from IS-Academia. Out of them,{" "}
            <strong>{stats.evenlyAssigned.A}</strong> were assigned to group A
            and <strong>{stats.evenlyAssigned.B}</strong> were assigned to group
            B.
          </p>

          {!stats.numbersValid && (
            <p className="prose text-red-600">
              The numbers in the group assignments are invalid.
            </p>
          )}

          {stats.assignmentChanged.length > 0 && (
            <>
              <h2 className="text-lg mt-8 mb-2 font-medium">
                Non-matching assignments
              </h2>

              <p className="prose">
                The following students are in a group which does do not match
                their initial assignment.
              </p>

              <Table rows={stats.assignmentChanged} identities={identities} />
            </>
          )}

          {stats.randomAssigned.length > 0 && (
            <>
              <h2 className="text-lg mt-8 mb-2 font-medium">
                Random assignments
              </h2>

              <p className="prose">
                The following students were assigned to a group randomly because
                they were not imported from IS-Academia when they first logged
                in to the platform. They don’t count in the even distribution of
                groups.
              </p>

              <Table rows={stats.randomAssigned} identities={identities} />
            </>
          )}
        </>
      )}
    </>
  );
}

function Table({
  rows,
  identities,
}: {
  rows: {
    id: string;
    identifier?: string;
    group: string;
    isAdmin?: boolean;
    earlyAccess?: boolean;
  }[];
  identities: Identities;
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
          <tr key={student.id}>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
              {student.identifier && student.identifier in identities
                ? identities[student.identifier].email
                : "Unknown"}
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
