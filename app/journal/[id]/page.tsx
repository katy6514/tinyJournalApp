import { lusitana } from "@/app/ui/fonts";
import { fetchEntryByID } from "@/app/lib/data";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const entry = await fetchEntryByID(id);

  const { date, date_id, text, legname, state } = entry;

  console.log({ id });

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        single journal entry
        {legname} - {state} on{" "}
        {new Date(date + "T00:00:00").toLocaleDateString()}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <p>{text}</p>
      </div>
    </main>
  );
}
