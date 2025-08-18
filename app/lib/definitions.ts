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
