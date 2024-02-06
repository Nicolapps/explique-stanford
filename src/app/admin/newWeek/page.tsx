"use client";

import { useMutation } from "@/usingSession";
import { api } from "../../../../convex/_generated/api";
import React, { useState } from "react";
import Input from "@/components/Input";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/util/date";

export default function NewWeek() {
  const router = useRouter();
  const create = useMutation(api.admin.weeks.create);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("7");

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
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <h1 className="font-semibold text-4xl tracking-tight mb-8">New Week</h1>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            if (!endDate || !endDateExtraTime) throw new Error("Invalid state");

            await create({
              name,
              startDate: +new Date(startDate),
              endDate: +endDate,
              endDateExtraTime: +endDateExtraTime,
            });

            router.push("/admin");
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
                    <br />(<strong>
                      {formatDateTime(endDateExtraTime)}
                    </strong>{" "}
                    for students with extra time)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-slate-500 text-white py-2 px-4 rounded-md"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
