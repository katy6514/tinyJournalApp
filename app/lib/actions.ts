"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  date: z.string(),
  date_id: z.coerce.number(),
  text: z.string(),
  legname: z.string(),
  state: z.string(),
});

const CreateEntry = FormSchema.omit({ date: true });

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

// const CreateInvoice = FormSchema.omit({ id: true, date: true });

// export async function createEntry(formData: FormData) {
//   const { customerId, amount, status } = CreateInvoice.parse({
//     customerId: formData.get("customerId"),
//     amount: formData.get("amount"),
//     status: formData.get("status"),
//   });
//   const amountInCents = amount * 100;
//   const date = new Date().toISOString().split("T")[0];

//   await sql`
//     INSERT INTO invoices (customer_id, amount, status, date)
//     VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
//   `;

//   revalidatePath("/dashboard/invoices");
//   redirect("/dashboard/invoices");

//   // Test it out:
//   //   console.log(rawFormData);
// }
