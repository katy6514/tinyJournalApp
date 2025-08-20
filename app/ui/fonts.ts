import { Inter, Geist, Noto_Sans, Noto_Serif } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });

export const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: "400",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: "400",
});
