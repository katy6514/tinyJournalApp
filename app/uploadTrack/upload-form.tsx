"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createLeg,
  updateLegCoordinates,
  importLegsFromGeoJSON,
  backfillMileage,
  updateLegWithDate,
} from "@/app/lib/actions/legs";
import { Leg, DateRow } from "@/app/lib/definitions";
import { Label, Input, Select } from "@/app/ui/components/inputs";
import { Button } from "@/app/ui/components/button";

type Toast = { message: string; success: boolean };

export default function UploadTrackForm({
  legs,
  dates,
}: {
  legs: Leg[];
  dates: DateRow[];
}) {
  const [toast, setToast] = useState<Toast | null>(null);

  const [createState, createAction] = useActionState(createLeg, { message: "" });
  const [updateState, updateAction] = useActionState(updateLegCoordinates, { message: "" });
  const [importState, importAction] = useActionState(importLegsFromGeoJSON, { message: "" });
  const [backfillState, backfillAction] = useActionState(backfillMileage, { message: "" });

  useEffect(() => {
    if (!createState.message) return;
    setToast({ message: createState.message, success: createState.message.includes("successfully") });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [createState]);

  useEffect(() => {
    if (!updateState.message) return;
    setToast({ message: updateState.message, success: updateState.message.includes("successfully") });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [updateState]);

  useEffect(() => {
    if (!importState.message) return;
    setToast({ message: importState.message, success: importState.message.includes("Successfully") });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [importState]);

  useEffect(() => {
    if (!backfillState.message) return;
    const success = backfillState.message.includes("Calculated") || backfillState.message.includes("already");
    setToast({ message: backfillState.message, success });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [backfillState]);

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6 space-y-10 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Upload Track Data
          </h1>
          <Button href="/journal/map" variant="secondary">
            Back to Map
          </Button>
        </div>

        {/* ── Create New Leg ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200">
            Create New Leg
          </h2>
          <form action={createAction} className="space-y-4">
            <div>
              <Label htmlFor="create-legnum">Leg Number</Label>
              <Input
                id="create-legnum"
                name="legnum"
                type="number"
                placeholder="e.g. 45"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-name">Leg Name</Label>
              <Input
                id="create-name"
                name="name"
                type="text"
                placeholder="e.g. sage brush camp - upper brooks lake"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-coordinates">Coordinates JSON File</Label>
              <input
                id="create-coordinates"
                name="coordinates"
                type="file"
                accept=".json,.geojson"
                required
                className="file-input w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" type="submit">
                Create Leg
              </Button>
            </div>
          </form>
        </section>

        {/* ── Import from GeoJSON FeatureCollection ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200">
            Import Legs from GeoJSON
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a GeoJSON FeatureCollection. Each LineString feature will be
            imported as a new leg using its <code>title</code> (legnum) and{" "}
            <code>description</code> (name) properties.
          </p>
          <form action={importAction} className="space-y-4">
            <div>
              <Label htmlFor="import-geojson">GeoJSON File</Label>
              <input
                id="import-geojson"
                name="geojson"
                type="file"
                accept=".json,.geojson"
                required
                className="file-input w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" type="submit">
                Import Legs
              </Button>
            </div>
          </form>
        </section>

        {/* ── Update Existing Leg Coordinates ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200">
            Update Leg Coordinates
          </h2>
          <form action={updateAction} className="space-y-4">
            <div>
              <Label htmlFor="update-leg">Select Leg</Label>
              <Select id="update-leg" name="legId" required>
                <option value="">Select a leg</option>
                {legs.map((leg) => (
                  <option key={leg.id} value={leg.id}>
                    {leg.legnum} — {leg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="update-coordinates">Coordinates JSON File</Label>
              <input
                id="update-coordinates"
                name="coordinates"
                type="file"
                accept=".json,.geojson"
                required
                className="file-input w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" type="submit">
                Update Coordinates
              </Button>
            </div>
          </form>
        </section>

        {/* ── Assign Leg to Date ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200">
            Assign Leg to Date
          </h2>
          <form action={updateLegWithDate} className="space-y-4">
            <div>
              <Label htmlFor="assign-leg">Select Leg</Label>
              <Select id="assign-leg" name="legId" required>
                <option value="">Select a leg</option>
                {legs.map((leg) => (
                  <option key={leg.id} value={leg.id}>
                    {leg.legnum} — {leg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="assign-date">Select Date</Label>
              <Select id="assign-date" name="dateId" required>
                <option value="">Select a date</option>
                {dates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.date}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" type="submit">
                Assign
              </Button>
            </div>
          </form>
        </section>

        {/* ── Backfill Mileage ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200">
            Backfill Mileage
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Calculate and store mileage for any legs that are missing it.
          </p>
          <form action={backfillAction}>
            <div className="flex justify-end">
              <Button variant="primary" type="submit">
                Calculate Missing Mileage
              </Button>
            </div>
          </form>
        </section>
      </div>

      {toast && (
        <div className="toast toast-end toast-bottom z-50">
          <div className={`alert ${toast.success ? "alert-success" : "alert-error"}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
