import { Inter, Geist, Geist_Mono, Playfair_Display } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
