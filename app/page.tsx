import Image from "next/image";
import { sourceSans } from "@/app/ui/fonts";
import { Button } from "./ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row justify-items-center, items-center">
      <div className="basis-1/2 ">
        <h1
          className={`text-2xl font-bold text-black dark:text-white md:text-6xl ${sourceSans.className} antialiased m-auto text-center`}
        >
          My CDT Journal
        </h1>
        <Button href="/login" variant="outlined" className="m-20">
          Log in
        </Button>
      </div>
      <div className="basis-1/2">
        <Image
          src="/passPic.jpg"
          width={394}
          height={700}
          alt="Photo of Katy nearing the top of a mountain pass in the Wind River Range near sunrise, many mountains and lakes behind her"
          className="object-cover w-full h-screen items-center"
          unoptimized
        />
      </div>
    </main>
  );
}
