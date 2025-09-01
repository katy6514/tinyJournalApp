// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.

export type Photo = {
  photo_id: string;
  date_id: string;
  path: string;
  title?: string;
  description?: string;
  width: number;
  height: number;
};

export type JournalEntry = {
  date: string;
  date_id: string;
  entry_id: string;
  text: string;
  legname: string;
  state: string;
  has_text: boolean;
  photos: Photo[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Leg = {
  id: string;
  name: string;
  coordinates: number[];
  date_id?: string;
};

export type DateRow = {
  id: string;
  date: string;
};

export const colors = {
  oddDays: "sky-300",
  campSites: "emerald-700",
  messages: "amber-500",
  evenDays: "blue-950",
  photos: "red-400",
  black: "black",
};

export const navigationColors = {
  oddDays: { dark: "sky-700", mid: "sky-500", light: "sky-200" },
  campSites: { dark: "emerald-700", mid: "emerald-500", light: "emerald-200" },
  messages: { dark: "amber-700", mid: "amber-500", light: "amber-200" },
  evenDays: { dark: "blue-700", mid: "blue-500", light: "blue-200" },
  photos: { dark: "red-700", mid: "red-500", light: "red-200" },
  black: "black",
};
