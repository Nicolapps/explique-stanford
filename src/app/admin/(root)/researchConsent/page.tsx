"use client";

import { Textarea } from "@/components/Input";
import Title from "@/components/typography";
import { useMutation, useQuery } from "@/usingSession";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { toast } from "sonner";

export default function ResearchConsentPage() {
  const jwt = useQuery(api.admin.identitiesJwt.default, {});

  const [emails, setEmails] = useState("");
  const submit = useMutation(api.admin.researchConsent.default);

  return (
    <>
      <Title>Research Consent</Title>

      <p className="prose mb-4">
        Mark the following students as having filled in the research consent
        form:
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const validatedEmails = emails
            .split("\n")
            .map((l) => l.trim())
            .filter((email) => !!email);

          const invalidEmail = validatedEmails.find(
            (e) => !e.includes("@") || e.includes(" ") || e.includes(","),
          );
          if (invalidEmail) {
            toast.error(`Invalid email address: ${invalidEmail}`);
            return;
          }

          const resConvert = await fetch(
            "/api/admin/computeIdentifiers?for=" + validatedEmails.join(","),
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            },
          );

          if (resConvert.status !== 200) {
            toast.error("Failed to retrieve the email addresses.");
            return;
          }

          const identifiers = await resConvert.json();
          const { added, notInGroups } = await submit({ identifiers });
          toast.success(`${added} students added.`);

          if (notInGroups.length > 0) {
            const missingEmails = notInGroups.map(
              (identifier: string) =>
                validatedEmails[identifiers.indexOf(identifier)],
            );
            toast.warning(
              `The following students are not present in the IS-Academia import: ${missingEmails.join(", ")}`,
              {
                duration: Infinity,
                closeButton: true,
              },
            );
          }
        }}
      >
        <Textarea
          value={emails}
          onChange={setEmails}
          label="Email addresses"
          hint="Separate the addresses by a line return."
        />

        <button
          type="submit"
          className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white sm:text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
          onClick={async () => {}}
          disabled={jwt === undefined}
        >
          Submit
        </button>
      </form>
    </>
  );
}
