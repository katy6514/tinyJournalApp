"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { auth } from "@/auth";

import sql from "../db";

export type UploadPhotoResult = {
  results: Array<{
    filename: string;
    status: "success" | "error";
    message: string;
  }>;
};

export async function uploadPhotos(
  _prevState: UploadPhotoResult,
  formData: FormData,
): Promise<UploadPhotoResult> {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  // Dynamic import: exifr is ESM-only, can't be top-level imported in a CJS context
  const exifr = (await import("exifr")).default;

  const title = (formData.get("title") as string | null) || null;
  const files = formData.getAll("photos") as File[];

  if (!files.length || (files.length === 1 && files[0].size === 0)) {
    return { results: [{ filename: "", status: "error", message: "No files provided." }] };
  }

  const results: UploadPhotoResult["results"] = [];

  for (const file of files) {
    const originalName = file.name;

    // Validate MIME type
    const nameLower = file.name.toLowerCase();
    const isJpeg = file.type === "image/jpeg" || nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg");
    const isHeic = file.type === "image/heic" || file.type === "image/heic-sequence" || nameLower.endsWith(".heic");
    if (!isJpeg && !isHeic) {
      results.push({ filename: originalName, status: "error", message: "Only JPEG and HEIC files are accepted." });
      continue;
    }

    // Read the original buffer — EXIF must be extracted before conversion
    // because heic-convert strips metadata from the output JPEG
    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Extract EXIF from original (EXIF is present in HEIC before conversion)
    let lat: number | null = null;
    let lon: number | null = null;
    let dateTimeStr: string | null = null;
    let calendarDate: string | null = null;
    let width: number | null = null;
    let height: number | null = null;

    try {
      // exifr.gps() is the most reliable cross-format GPS extractor (JPEG and HEIC)
      // It bypasses the pick-filter issue where the GPS sub-IFD isn't always parsed
      const gps = await exifr.gps(originalBuffer);
      if (gps) {
        lat = gps.latitude ?? null;
        lon = gps.longitude ?? null;
      }
    } catch {
      // Non-fatal: photo saves without GPS coords if none embedded
    }

    try {
      const exifData = await exifr.parse(originalBuffer, {
        pick: ["DateTimeOriginal", "ExifImageWidth", "ExifImageHeight"],
      });
      if (exifData) {
        width = exifData.ExifImageWidth ?? null;
        height = exifData.ExifImageHeight ?? null;

        const dt: Date | undefined = exifData.DateTimeOriginal;
        if (dt instanceof Date) {
          const y  = dt.getFullYear();
          const mo = String(dt.getMonth() + 1).padStart(2, "0");
          const d  = String(dt.getDate()).padStart(2, "0");
          const h  = String(dt.getHours()).padStart(2, "0");
          const mi = String(dt.getMinutes()).padStart(2, "0");
          const s  = String(dt.getSeconds()).padStart(2, "0");
          dateTimeStr = `${y}:${mo}:${d} ${h}:${mi}:${s}`;
          calendarDate = `${y}-${mo}-${d}`;
        }
      }
    } catch {
      // Non-fatal: photo saves without date/dimensions if EXIF is unreadable
    }

    // Require a matching date in the dates table (date_id is NOT NULL)
    let dateId: number | null = null;
    if (calendarDate) {
      const dateRow = await sql<{ id: number }[]>`
        SELECT id FROM dates WHERE date = ${calendarDate}::date LIMIT 1
      `;
      if (dateRow.length > 0) dateId = dateRow[0].id;
    }

    if (!dateId) {
      const msg = calendarDate
        ? `No trail date found for ${calendarDate}. Photo not saved.`
        : "No EXIF date found in photo. Photo not saved.";
      results.push({ filename: originalName, status: "error", message: msg });
      continue;
    }

    // Check for an existing photo with the same date_time + date_id (re-upload of a photo
    // that previously failed GPS extraction). If found, update lat/lon in place and skip
    // writing a new file to avoid duplicates.
    if (dateTimeStr) {
      const existing = await sql<{ id: number; lat: number | null }[]>`
        SELECT id, lat FROM photos WHERE date_time = ${dateTimeStr} AND date_id = ${dateId} LIMIT 1
      `;
      if (existing.length > 0) {
        if (existing[0].lat !== null) {
          results.push({ filename: originalName, status: "error", message: "Photo already exists with GPS data. Skipping." });
          continue;
        }
        // Update GPS on the existing row — no new file needed
        await sql`
          UPDATE photos SET lat = ${lat}, lon = ${lon} WHERE id = ${existing[0].id}
        `;
        results.push({ filename: originalName, status: "success", message: "Updated existing photo with GPS coordinates." });
        continue;
      }
    }

    // Convert HEIC to JPEG now that EXIF has been extracted
    let storageBuffer = originalBuffer;
    if (isHeic) {
      try {
        const heicConvert = (await import("heic-convert")).default;
        const converted = await heicConvert({ buffer: originalBuffer as unknown as ArrayBuffer, format: "JPEG", quality: 0.9 });
        storageBuffer = Buffer.from(converted);
      } catch (e) {
        results.push({ filename: originalName, status: "error", message: `HEIC conversion failed: ${String(e)}` });
        continue;
      }
    }

    // Write file to public/CDTphotos/
    const uuid = randomUUID().toUpperCase();
    const filename = `${uuid}.jpg`;
    const filePath = path.join(process.cwd(), "public", "CDTphotos", filename);
    const srcPath = `/CDTphotos/${filename}`;

    try {
      await writeFile(filePath, storageBuffer);
    } catch (e) {
      results.push({ filename: originalName, status: "error", message: `Failed to write file: ${String(e)}` });
      continue;
    }

    // Insert into DB
    try {
      await sql`
        INSERT INTO photos (src, width, height, date_id, title, lat, lon, date_time)
        VALUES (
          ${srcPath},
          ${width},
          ${height},
          ${dateId},
          ${title},
          ${lat},
          ${lon},
          ${dateTimeStr}
        )
      `;
    } catch (e) {
      // Rollback file write on DB failure
      try { await unlink(filePath); } catch { /* ignore cleanup error */ }
      const errStr = String(e);
      const msg = errStr.includes("unique") || errStr.includes("duplicate")
        ? "A photo with this path already exists."
        : `Database error: ${errStr}`;
      results.push({ filename: originalName, status: "error", message: msg });
      continue;
    }

    results.push({ filename: originalName, status: "success", message: `Saved as ${filename}` });
  }

  revalidateTag("photos");
  revalidatePath("/journal/photoAlbum");

  return { results };
}
