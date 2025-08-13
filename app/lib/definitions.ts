// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
export type JournalEntry = {
  id: string;
  date: Date;
  legname: string;
  state: string;
  text: string;
};
