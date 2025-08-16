// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
export type JournalEntry = {
  date: string;
  date_id: string;
  id: string;
  text: string;
  legname: string;
  state: string;
  has_text: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};
