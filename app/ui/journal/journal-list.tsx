import { JournalEntry } from "@/app/lib/definitions";
import JournalCard from "../components/journal-card";
import Link from "next/link";

export default function JournalList({ entries }: { entries: JournalEntry[] }) {
  return (
    <div>
      {entries.map((entry) => (
        <Link
          href={`/journal/${entry.entry_id}`}
          className="block"
          key={entry.entry_id}
        >
          <JournalCard entry={entry} />
        </Link>
      ))}
    </div>
  );
}
