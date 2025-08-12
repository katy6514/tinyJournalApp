// this file is for fetching data from the database

import postgres from 'postgres';
import {
  JournalEntry,
} from './definitions';
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchJournal() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<JournalEntry[]>`SELECT * FROM entries`;

    // console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch journal entries.');
  }
}