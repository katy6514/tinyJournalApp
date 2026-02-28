"use client";

import { useActionState } from "react";
import { createLeg, updateLegCoordinates, importLegsFromGeoJSON, backfillMileage } from "@/app/lib/actions";
import { Leg } from "@/app/lib/definitions";
import { Label, Input, Select } from "@/app/ui/components/inputs";
import { Button } from "@/app/ui/components/button";

const baseFileInputClasses =
  "block w-full text-sm text-gray-900 border border-gray-300 bg-white p-2.5 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

export default function UploadTrackForm({ legs }: { legs: Leg[] }) {
  const [createState, createAction] = useActionState(createLeg, { message: null });
  const [updateState, updateAction] = useActionState(updateLegCoordinates, { message: null });
  const [importState, importAction] = useActionState(importLegsFromGeoJSON, { message: null });
  const [backfillState, backfillAction] = useActionState(backfillMileage, { message: "" });

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6 space-y-10 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Upload Track Data
        </h1>
        <Button href="/journal/map" variant="light">
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
              accept=".json"
              required
              className={baseFileInputClasses}
            />
          </div>
          {createState.message && (
            <p
              className={`text-sm ${
                createState.message.includes("successfully")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {createState.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="dark" type="submit">
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
              className={baseFileInputClasses}
            />
          </div>
          {importState.message && (
            <p
              className={`text-sm ${
                importState.message.includes("Successfully")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {importState.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="dark" type="submit">
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
              accept=".json"
              required
              className={baseFileInputClasses}
            />
          </div>
          {updateState.message && (
            <p
              className={`text-sm ${
                updateState.message.includes("successfully")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {updateState.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="dark" type="submit">
              Update Coordinates
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
          {backfillState.message && (
            <p
              className={`text-sm mb-4 ${
                backfillState.message.includes("Calculated") || backfillState.message.includes("already")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {backfillState.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="dark" type="submit">
              Calculate Missing Mileage
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
