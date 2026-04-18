"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import sql from "../db";

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

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to create entry.",
    };
  }

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

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to create entry.",
    };
  }

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
