import { formatDateTime } from "@/util/date";
import { useState } from "react";
import Input from "./Input";
import { Id } from "../../convex/_generated/dataModel";

export type State = {
  name: string;
  startDate: string;
  duration: string;
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
  const [duration, setDuration] = useState(initialState.duration);

  let endDate: Date | null = null;
  let endDateExtraTime: Date | null = null;
  if (startDate && /^\d+$/.test(duration)) {
    const timeIncrement = parseInt(duration) * 24 * 60 * 60 * 1000;

    endDate = new Date(startDate);
    endDate.setTime(endDate.getTime() + timeIncrement);

    endDateExtraTime = new Date(startDate);
    endDateExtraTime.setTime(
      endDateExtraTime.getTime() + (timeIncrement * 4) / 3,
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();

        if (!endDate || !endDateExtraTime) throw new Error("Invalid state");

        onSubmit({
          name,
          startDate: +new Date(startDate),
          endDate: +endDate,
          endDateExtraTime: +endDateExtraTime,
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

      <div className="grid md:grid-cols-2 gap-x-6 items-center">
        <div>
          <Input
            value={startDate}
            onChange={setStartDate}
            label="Release"
            type="datetime-local"
            required
          />

          <Input
            value={duration}
            onChange={setDuration}
            label="Duration (days)"
            type="number"
            min="1"
            max="14"
            step="1"
            required
          />
        </div>

        <div>
          {endDate && endDateExtraTime && (
            <div className="mb-4 border p-4 rounded bg-slate-50">
              <p>
                Due date: <strong>{formatDateTime(endDate)}</strong>
                <br />(<strong>{formatDateTime(endDateExtraTime)}</strong> for
                students with extra time)
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="bg-slate-500 text-white py-2 px-4 rounded-md"
      >
        {submitLabel}
      </button>
    </form>
  );
}
