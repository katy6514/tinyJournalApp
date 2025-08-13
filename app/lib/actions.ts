"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  date: z.string(),
  entry_id: z.string(),
  date_id: z.coerce.number(),
  text: z.string(),
  legname: z.string(),
  state: z.string(),
});

const CreateEntry = FormSchema.omit({ date: true, entry_id: true });

export async function createEntry(formData: FormData) {
  //   const rawFormData = {
  //     date_id: formData.get("date_id"),
  //     state: formData.get("state"),
  //     legname: formData.get("legname"),
  //     text: formData.get("entryText"),
  //   };
  const { date_id, state, legname, text } = CreateEntry.parse({
    date_id: formData.get("date_id"),
    state: formData.get("state"),
    legname: formData.get("legname"),
    text: formData.get("entryText"),
  });

  await sql`
    INSERT INTO entries (date_id, legname, state, text)
    VALUES (${date_id}, ${legname}, ${state}, ${text})
  `;

  revalidatePath("/journal/listView");
  redirect("/journal/listView");
}
