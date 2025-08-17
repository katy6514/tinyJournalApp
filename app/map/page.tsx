// import { lusitana } from "@/app/ui/fonts";
// import { fetchEntryByID } from "@/app/lib/data";
import CDTmap from "./CDTmap";

export default async function Page() {
  return (
    <main>
      <h2>The Map</h2>
      <CDTmap />
    </main>
  );
}
