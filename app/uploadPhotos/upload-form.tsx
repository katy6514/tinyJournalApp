"use client";

import { useActionState } from "react";
import { uploadPhotos, UploadPhotoResult } from "@/app/lib/actions/photos";
import { Label, Input } from "@/app/ui/components/inputs";
import { Button } from "@/app/ui/components/button";

const initialState: UploadPhotoResult = { results: [] };

export default function UploadPhotosForm() {
  const [state, action, isPending] = useActionState(uploadPhotos, initialState);

  return (
    <main className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Upload Photos
          </h1>
          <Button href="/journal/map" variant="secondary">
            Back to Map
          </Button>
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Upload JPEG Photos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            GPS coordinates and date are read automatically from EXIF data. Each
            photo must have an EXIF date matching a trail day in the database.
            Photos without GPS will be saved to the album but won&apos;t appear
            on the map.
          </p>
          <form action={action} className="space-y-4">
            <div>
              <Label htmlFor="upload-title">Title (optional — applied to all files)</Label>
              <Input
                id="upload-title"
                name="title"
                type="text"
                placeholder="e.g. Summit views"
              />
            </div>
            <div>
              <Label htmlFor="upload-photos">JPEG Files</Label>
              <input
                id="upload-photos"
                name="photos"
                type="file"
                accept="image/jpeg,image/heic,image/heic-sequence,.jpg,.jpeg,.heic"
                multiple
                required
                className="file-input w-full"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit" disabled={isPending}>
                {isPending ? "Uploading…" : "Upload Photos"}
              </Button>
            </div>
          </form>
        </section>

        {state.results.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Results
            </h2>
            <ul className="space-y-2">
              {state.results.map((r, i) => (
                <li
                  key={i}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    r.status === "success"
                      ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  <span className="font-medium">{r.filename || "File"}</span>
                  {" — "}
                  {r.message}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
