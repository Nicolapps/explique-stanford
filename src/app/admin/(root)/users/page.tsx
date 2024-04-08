"use client";

import Title from "@/components/typography";
import React from "react";
import { useIdentities } from "@/hooks/useIdentities";

export default function UsersPage() {
  const identites = useIdentities();

  return (
    <>
      <Title>Users</Title>
      {identites ? (
        <div className="pb-8">
          <table className="text-sm w-full divide-y divide-slate-300">
            <thead>
              <tr>
                <th scope="col" className="px-2 py-3 align-bottom text-left">
                  Identifier
                </th>
                <th scope="col" className="px-2 py-3 align-bottom text-left">
                  Email address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(identites)
                .sort((a, b) => a[1].email.localeCompare(b[1].email))
                .map(([identifier, { email }]) => (
                  <tr key={identifier}>
                    <td className="px-2 py-3">
                      <code className="block w-full truncate">
                        {identifier}
                      </code>
                    </td>
                    <td className="px-2 py-3">{email}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      )}
    </>
  );
}
