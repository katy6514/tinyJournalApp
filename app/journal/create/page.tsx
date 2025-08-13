import Form from "@/app/ui/journal/create-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
// import { fetchCustomers } from "@/app/lib/data";

export default async function Page() {
  //   const customers = await fetchCustomers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Entries", href: "/journal/listView" },
          {
            label: "Create Entry",
            href: "/journal/listView/create",
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}
