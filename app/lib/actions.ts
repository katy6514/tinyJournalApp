"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import sql from "./db";

const FormSchema = z.object({
  date: z.string(),
  id: z.string(),
  date_id: z.string().min(1, { message: "Please select a date." }),
  text: z.string().min(1, { message: "Please enter some text." }),
  legname: z.string().min(1, { message: "Please enter a title or leg name." }),
  state: z.string().min(1, { message: "Please select a state." }),
});

const CreateEntry = FormSchema.omit({ date: true, id: true });
const UpdateEntry = FormSchema.omit({ id: true, date: true, date_id: true });

export type State = {
  errors?: {
    date_id?: string[];
    legname?: string[];
    state?: string[];
    text?: string[];
  };
  message?: string | null;
};

export async function createEntry(prevState: State, formData: FormData) {
  const validatedFields = CreateEntry.safeParse({
    date_id: formData.get("date_id"),
    state: formData.get("state"),
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
  const { date_id, legname, state, text } = validatedFields.data;
  const returnPage = formData.get("returnPage") || "1";

  await sql`
    INSERT INTO entries (date_id, legname, state, text)
    VALUES (${date_id}, ${legname}, ${state}, ${text})
  `;
  revalidatePath("/journal/listView");
  redirect(`/journal/listView?page=${returnPage}`);
}

export type EditState = {
  errors?: {
    legname?: string[];
    state?: string[];
    text?: string[];
  };
  message?: string | null;
};

export async function updateEntry(
  id: string,
  prevState: EditState,
  formData: FormData
) {
  const validatedFields = UpdateEntry.safeParse({
    state: formData.get("state"),
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

  const { state, legname, text } = validatedFields.data;

  await sql`
    UPDATE entries
    SET state = ${state}, legname = ${legname}, text = ${text}
    WHERE id = ${id}
  `;
  revalidatePath("/journal/listView");
  redirect("/journal/listView");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
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

function haversineDistance([lon1, lat1]: number[], [lon2, lat2]: number[]): number {
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
  _prevState: { message: string | null },
  formData: FormData
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
      f.properties?.title != null
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
  _prevState: { message: string | null },
  formData: FormData
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
  _prevState: { message: string | null },
  formData: FormData
) {
  const legId = formData.get("legId") as string;
  const file = formData.get("coordinates") as File;

  if (!legId || !file || file.size === 0) {
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
    UPDATE legs SET coordinates =   ${sql.json(coordinates)}, mileage = ${mileage} WHERE id = ${legId}
  `;
  revalidatePath("/uploadTrack");
  revalidateTag("legs");
  return { message: "Coordinates updated successfully." };
}

export async function backfillMileage(
  _prevState: { message: string },
  _formData: FormData
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
  revalidatePath("/assignLegs");
  redirect("/assignLegs");
}
