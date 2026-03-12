import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UploadPhotosForm from "./upload-form";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");
  return <UploadPhotosForm />;
}
