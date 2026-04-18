"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { auth } from "@/auth";

import sql from "./db";

const FormSchema = z.object({
  date: z.string(),
  id: z.string(),
  date_id: z.string().min(1, { message: "Please select a date." }),
  text: z.string().min(1, { message: "Please enter some text." }),
  legname: z.string().min(1, { message: "Please enter a title or leg name." }),
  state_id: z.string().min(1, { message: "Please select a state." }),
});

const CreateEntry = FormSchema.omit({ date: true, id: true });
const UpdateEntry = FormSchema.omit({ id: true, date: true, date_id: true });

export type State = {
  errors?: {
    date_id?: string[];
    legname?: string[];
    state_id?: string[];
    text?: string[];
  };
  message?: string | null;
};

export async function createEntry(prevState: State, formData: FormData) {
  const validatedFields = CreateEntry.safeParse({
    date_id: formData.get("date_id"),
    state_id: formData.get("state_id"),
    legname: formData.get("legname"),
    text: formData.get("text"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to create entry.",
    };
  }

  // Prepare data for insertion into the database
  const { date_id, legname, state_id, text } = validatedFields.data;
  const returnPage = formData.get("returnPage") || "1";

  await sql`
    INSERT INTO entries (date_id, legname, state_id, text)
    VALUES (${date_id}, ${legname}, ${state_id}, ${text})
  `;
  revalidatePath("/journal/listView");
  redirect(`/journal/listView?page=${returnPage}`);
}

export type EditState = {
  errors?: {
    legname?: string[];
    state_id?: string[];
    text?: string[];
  };
  message?: string | null;
};

export async function updateEntry(
  id: string,
  prevState: EditState,
  formData: FormData,
) {
  const validatedFields = UpdateEntry.safeParse({
    state_id: formData.get("state_id"),
    legname: formData.get("legname"),
    text: formData.get("text"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to create entry.",
    };
  }
  // Prepare data for insertion into the database

  const { state_id, legname, text } = validatedFields.data;

  await sql`
    UPDATE entries
    SET state_id = ${state_id}, legname = ${legname}, text = ${text}
    WHERE id = ${id}
  `;
  revalidatePath(`/journal/${id}`);
  redirect(`/journal/${id}`);
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

function haversineDistance(
  [lon1, lat1]: number[],
  [lon2, lat2]: number[],
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371;
}

function calculateMileage(coordinates: number[][]): number {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineDistance(coordinates[i], coordinates[i + 1]);
  }
  return Math.round(total * 100) / 100;
}

export async function importLegsFromGeoJSON(
  _prevState: { message: string },
  formData: FormData,
) {
  const file = formData.get("geojson") as File;

  if (!file || file.size === 0) {
    return { message: "File is required." };
  }

  let geojson;
  try {
    const text = await file.text();
    geojson = JSON.parse(text);
  } catch {
    return { message: "Invalid JSON file." };
  }

  if (!Array.isArray(geojson.features)) {
    return { message: "Invalid GeoJSON: missing features array." };
  }

  type GeoFeature = {
    geometry: { type: string; coordinates: number[][] };
    properties: { title: string; description?: string };
  };

  const features = (geojson.features as GeoFeature[]).filter(
    (f) =>
      f.geometry?.type === "LineString" &&
      Array.isArray(f.geometry?.coordinates) &&
      f.properties?.title != null,
  );

  if (features.length === 0) {
    return { message: "No valid LineString features found in file." };
  }

  for (const feature of features) {
    const legnum = parseFloat(feature.properties.title);
    const name = feature.properties.description ?? "";
    const coordinates = feature.geometry.coordinates;
    const mileage = calculateMileage(coordinates);

    await sql`
      INSERT INTO legs (legnum, name, coordinates, mileage)
      VALUES (${legnum}, ${name},   ${sql.json(coordinates)}, ${mileage})
    `;
  }

  revalidatePath("/uploadTrack");
  revalidateTag("legs");
  return { message: `Successfully imported ${features.length} leg(s).` };
}

export async function createLeg(
  _prevState: { message: string },
  formData: FormData,
) {
  const legnum = Number(formData.get("legnum"));
  const name = formData.get("name") as string;
  const file = formData.get("coordinates") as File;

  if (!legnum || !name || !file || file.size === 0) {
    return { message: "All fields are required." };
  }

  let coordinates;
  try {
    const text = await file.text();
    coordinates = JSON.parse(text);
  } catch {
    return { message: "Invalid JSON file." };
  }

  const mileage = calculateMileage(coordinates);

  await sql`
    INSERT INTO legs (legnum, name, coordinates, mileage)
    VALUES (${legnum}, ${name},   ${sql.json(coordinates)}, ${mileage})
  `;
  revalidatePath("/uploadTrack");
  revalidateTag("legs");
  return { message: "Leg created successfully." };
}

export async function updateLegCoordinates(
  _prevState: { message: string },
  formData: FormData,
) {
  const legId = formData.get("legId") as string;
  const file = formData.get("coordinates") as File;

  if (!legId || !file || file.size === 0) {
    return { message: "All fields are required." };
  }

  let coordinates;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (parsed?.type === "FeatureCollection") {
      const feature = parsed.features?.find(
        (f: { geometry?: { type: string } }) =>
          f.geometry?.type === "LineString",
      );
      console.log("Parsed GeoJSON with features:", parsed.features?.length);
      if (!feature)
        return { message: "No LineString feature found in FeatureCollection." };
      coordinates = feature.geometry.coordinates;
    } else {
      coordinates = parsed;
    }
  } catch {
    return { message: "Invalid JSON file." };
  }

  const mileage = calculateMileage(coordinates);

  await sql`
    UPDATE legs SET coordinates =   ${sql.json(coordinates)}, mileage = ${mileage} WHERE id = ${legId}
  `;
  revalidatePath("/uploadTrack");
  revalidateTag("legs");
  return { message: "Coordinates updated successfully." };
}

export async function backfillMileage(
  _prevState: { message: string },
  _formData: FormData,
): Promise<{ message: string }> {
  const legs = await sql<{ id: number; coordinates: number[][] }[]>`
    SELECT id, coordinates FROM legs WHERE mileage IS NULL AND coordinates IS NOT NULL
  `;

  if (legs.length === 0) {
    return { message: "All legs already have mileage calculated." };
  }

  for (const leg of legs) {
    const mileage = calculateMileage(leg.coordinates);
    await sql`UPDATE legs SET mileage = ${mileage} WHERE id = ${leg.id}`;
  }

  revalidatePath("/uploadTrack");
  revalidateTag("legs");
  return { message: `Calculated mileage for ${legs.length} leg(s).` };
}

export async function updateLegWithDate(formData: FormData) {
  const rawFormData = {
    legId: formData.get("legId"),
    dateId: formData.get("dateId"),
  };

  // Narrow the types
  const legId = rawFormData.legId as string;
  const dateId = rawFormData.dateId as string;

  await sql`
    UPDATE dates SET leg_id = ${legId} WHERE id = ${dateId};
  `;
  revalidatePath("/uploadTrack");
  redirect("/uploadTrack");
}

/* ============================================================
 *  Photo Upload
 * ============================================================ */

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
