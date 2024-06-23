import { formatDateTime } from "@/util/date";
import { useState } from "react";
import Input from "./Input";
import { PrimaryButton } from "./PrimaryButton";
import { toast } from "sonner";

export type State = {
  name: string;
  startDate: string;
  endDate: string;
};

export default function WeekForm({
  initialState,
  onSubmit,
  submitLabel,
}: {
  initialState: State;
  onSubmit: (state: {
    name: string;
    startDate: number;
    endDate: number;
    endDateExtraTime: number;
  }) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initialState.name);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [endDate, setEndDate] = useState(initialState.endDate);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();

        if (startDate >= endDate) {
          toast.error("The end date must be after the start date");
          return;
        }

        onSubmit({
          name,
          startDate: +new Date(startDate),
          endDate: +new Date(endDate),
          endDateExtraTime: +new Date(endDate) + 1000 * 60 * 60 * 24, // + 1 day,
        });
      }}
    >
      {/* Name, start date, duration */}
      <Input
        value={name}
        onChange={setName}
        label="Name"
        placeholder="Week 1"
        required
      />

      <Input
        value={startDate}
        onChange={setStartDate}
        label="Release"
        type="datetime-local"
        required
      />

      <Input
        value={endDate}
        onChange={setEndDate}
        label="Deadline"
        type="datetime-local"
        required
      />

      <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
    </form>
  );
}
