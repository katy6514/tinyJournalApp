"use client";

import { useState } from "react";
import { updateLegWithDate } from "@/app/lib/actions";

import { Leg, DateRow } from "@/app/lib/definitions";

export default function AssignDateForm({
  legs,
  dates,
}: {
  legs: Leg[];
  dates: DateRow[];
}) {
  const [legId, setLegId] = useState("");
  const [dateId, setDateId] = useState("");

  return (
    <form action={updateLegWithDate}>
      <select
        value={legId}
        name="legId"
        onChange={(e) => setLegId(e.target.value)}
      >
        <option value="">Select a leg</option>
        {legs.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <select
        value={dateId}
        name="dateId"
        onChange={(e) => setDateId(e.target.value)}
      >
        <option value="">Select a date</option>
        {dates.map((d) => (
          <option key={d.id} value={d.id}>
            {d.date}
          </option>
        ))}
      </select>

      <button type="submit">Assign</button>
    </form>
  );
}
