"use server";
export async function createEntry(formData: FormData) {}

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
