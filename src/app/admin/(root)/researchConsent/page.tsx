"use client";

import { Textarea } from "@/components/Input";
import Title from "@/components/typography";
import { useMutation } from "@/usingSession";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { toast } from "sonner";

export default function ResearchConsentPage() {
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
          const { added, notInGroups } = await submit({ emails });
          toast.success(`${added} students added.`);

          if (notInGroups.length > 0) {
            toast.warning(
              `The following students are not present in the IS-Academia import: ${notInGroups.join(", ")}`,
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
          className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
          onClick={async () => {}}
        >
          Submit
        </button>
      </form>
    </>
  );
}
