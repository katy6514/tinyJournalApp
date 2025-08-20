import Image from "next/image";

import LoginForm from "@/app/ui/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="flex flex-column justify-items-center, items-center">
      <div className="basis-1/4 ">
        <Image
          src="/titcombBasin.jpg"
          width={394}
          height={700}
          alt="Photo of Katy nearing the top of a mountain pass in the Wind River Range near sunrise, many mountains and lakes behind her"
          className="object-cover w-full h-screen items-center"
        />
      </div>
      <div className="basis-3/4 ">
        <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
