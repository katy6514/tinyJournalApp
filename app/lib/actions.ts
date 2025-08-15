"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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
    text: formData.get("entryText"),
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

  try {
    await sql`
    INSERT INTO entries (date_id, legname, state, text)
    VALUES (${date_id}, ${legname}, ${state}, ${text})
  `;
  } catch (error) {
    console.error(error);
  }
  revalidatePath("/journal/listView");
  redirect("/journal/listView");
}

export async function updateEntry(id: string, formData: FormData) {
  const { state, legname, text } = UpdateEntry.parse({
    state: formData.get("state"),
    legname: formData.get("legname"),
    text: formData.get("text"),
  });

  try {
    await sql`
    UPDATE entries
    SET state = ${state}, legname = ${legname}, text = ${text}
    WHERE id = ${id}
  `;
  } catch (error) {
    console.error(error);
  }
  revalidatePath("/journal/listView");
  redirect("/journal/listView");
}
