import { fetchLegs, fetchDates } from "@/app/lib/data";
import AssignDateForm from "./update-leg-form";

export default async function Page() {
  const legs = await fetchLegs();
  const dates = await fetchDates();

  return <AssignDateForm legs={legs} dates={dates} />;
}
