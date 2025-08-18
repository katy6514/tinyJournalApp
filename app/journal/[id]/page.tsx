import { lusitana } from "@/app/ui/fonts";
import { fetchEntryByID } from "@/app/lib/data";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const entries = await fetchEntryByID(id);
  const entry = Array.isArray(entries) ? entries[0] : entries;

  const { date, date_id, text, legname, state } = entry || {};

  console.log({ id });

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        single journal entry for {id}
        {legname} - {state} on {date}
        {new Date(date + "T00:00:00").toLocaleDateString()}
      </h1>
      <div className="">
        <p>{text}</p>
      </div>
    </main>
  );
}
