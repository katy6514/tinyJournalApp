import { fetchAllLegs, fetchDates } from "@/app/lib/data";
import UploadTrackForm from "./upload-form";

export default async function Page() {
  const [legs, dates] = await Promise.all([fetchAllLegs(), fetchDates()]);
  return <UploadTrackForm legs={legs} dates={dates} />;
}
