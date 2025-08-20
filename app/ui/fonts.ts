import {
  Mulish,
  Open_Sans,
  Noto_Sans,
  Noto_Serif,
  Source_Sans_3,
} from "next/font/google";

export const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: "300",
});

export const mulish = Mulish({
  subsets: ["latin"],
  weight: "400",
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: "400",
});

export const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: "400",
});

export const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: "400",
});
