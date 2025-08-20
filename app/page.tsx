import Image from "next/image";
import { notoSerif, notoSans } from "@/app/ui/fonts";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end  bg-linear-to-bl from-violet-500 to-fuchsia-500 p-4 md:h-52">
        {/* <AcmeLogo /> */}
        <h1
          className={`text-2xl font-bold text-white md:text-4xl ${notoSans.className} antialiased`}
        >
          My CDT Journal
        </h1>
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6  bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <div className="relative w-0 h-0 border-l-[15px] border-r-[15px] border-b-[26px] border-l-transparent border-r-transparent border-b-black" />
          <p
            className={`text-xl text-gray-800 md:text-3xl md:leading-normal ${notoSerif.className} antialiased`}
          >
            <strong>Welcome to Acme.</strong> This is the example for the{" "}
            <a href="https://nextjs.org/learn/" className="text-blue-500">
              Next.js Learn Course
            </a>
            , brought to you by Vercel.
          </p>
          {/* <Link
            href="/login"
            className="flex items-center gap-5 self-start  bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link> */}
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          <Image
            src="/smile.jpg"
            width={394}
            height={700}
            className="block"
            alt="Photo of Katy sitting on the ground in the Wind River Range, laughing at the camera"
          />
        </div>
      </div>
    </main>
  );
}
