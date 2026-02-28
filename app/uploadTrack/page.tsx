import { fetchAllLegs } from "@/app/lib/data";
import UploadTrackForm from "./upload-form";

export default async function Page() {
  const legs = await fetchAllLegs();
  return <UploadTrackForm legs={legs} />;
}
