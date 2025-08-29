import React from "react";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";

type PhaseProps = {
  title: string;
  items: string[];
};

const Phase: React.FC<PhaseProps> = ({ title, items }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  </div>
);

export default function DevelopmentJourney() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "About", href: "/journal" },
          {
            label: "Development Journey",
            href: `/journal/devJournal`,
            active: true,
          },
        ]}
      />
      <div className="max-w-3xl mx-auto p-6">
        {/* <h1 className="text-3xl font-bold mb-6">
          📜 Trail Journal App – Development Journey
        </h1> */}

        <Phase
          title="The Map / 'can she even make this thing'"
          items={[
            "Chose the geoConicConformal projection to render the 5 states the CDT traverses.",
            "Extracted data from Garmin device account to get coordinates of all messages sent",
            "Extracted photo metadata to plot photo locations.",
            "Identified my campsite locations by filtering Garmin message contents for my preset 'camped for the night!' messages",
            "Added custom map symbols (circles, triangles) to distinguish campsites, messages, photos, and resupply towns.",
            "Used locations of photos, messages,  on map to draw my daily progress with CalTopo.",
            "Exported CalTopo tracks as GeoJSON and added to the map.",
          ]}
        />

        <Phase
          title="Lets make it React"
          items={[
            "Migrated map rendering into a Next.js 14 (App Router) + React + TypeScript project.",
            "Installed and configured TailwindCSS for styling.",
            "Began shaping the concept into a full-stack trail journal app (not just a map).",
          ]}
        />

        <Phase
          title="Cleaning up the Data"
          items={[
            "Chose PostgreSQL as the database.",
            "Defined schema: users, dates, entries, photos, tracks/legs.",
            "Aggregated photos into an array per daily entry using json_agg.",
            "Built SQL queries to fetch journal entries by date and photos taken on same date.",
          ]}
        />

        <Phase
          title="Making it pretty and pretty usable"
          items={[
            "Componetize all buttons, JournalCards, navigation, etc.",
            "Set up create and edit routes for journal entries using React Server Actions.",
            "Used Typsescript to ensure end-to-end type safety.",
            "Styled with shadcn/ui + Tailwind for clean, consistent UI.",
          ]}
        />

        <Phase
          title="Authentication / It's my Diary after all"
          items={[
            "Implemented username + password authentication with NextAuth.js.",
            "Secured journal routes to ensure only authenticated users (me) can view complete entries.",
            "Hid contents of garmin messages in data visuaization behind authentication.",
          ]}
        />

        <Phase
          title="More to come"
          items={[
            "Build uploads for the data files",
            "Further work on components and styling",
            "Add a mini map to each journal entry showing location of photos taken that day along the daily track",
          ]}
        />

        {/* <div className="mt-10 p-4 bg-green-50 dark:bg-gray-700 border border-green-200 rounded-lg">
          <p className="font-semibold">✅ Current Status:</p>
          <p>
            Trail Journal App is a full-stack journaling platform with entries,
            photos, authentication, PostgreSQL database, and interactive D3 map
            visualization — deployed and production-ready. 🚀
          </p>
        </div> */}
      </div>
    </main>
  );
}
