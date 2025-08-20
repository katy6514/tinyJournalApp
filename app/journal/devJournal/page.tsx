import React from "react";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";

type PhaseProps = {
  title: string;
  items: string[];
};

const Phase: React.FC<PhaseProps> = ({ title, items }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <ul className="list-disc list-inside space-y-1 text-gray-700">
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
        <h1 className="text-3xl font-bold mb-6">
          📜 Trail Journal App – Development Journey
        </h1>

        <Phase
          title="Phase 1: D3 Map Exploration"
          items={[
            "Set up D3.js with geoConicConformal projection to render a U.S. map.",
            "Plotted points using GPS metadata extracted from photos.",
            "Added custom map symbols (circles, triangles) to distinguish campsites and towns.",
            "Experimented with overlaying trail lines and topographic contours.",
          ]}
        />

        <Phase
          title="Phase 2: React & Next.js Integration"
          items={[
            "Migrated map rendering into a Next.js 14 (App Router) + React + TypeScript project.",
            "Installed and configured TailwindCSS for styling.",
            "Began shaping the concept into a full-stack trail journal app (not just a map).",
          ]}
        />

        <Phase
          title="Phase 3: Database Setup"
          items={[
            "Chose PostgreSQL as the database.",
            "Defined schema: users, dates, entries, photos.",
            "Set up db-migrate for database migrations.",
            "Debugged Postgres role/permissions locally until stable.",
          ]}
        />

        <Phase
          title="Phase 4: Backend Data Layer"
          items={[
            "Built SQL queries to fetch journal entries with related dates and trail legs.",
            "Aggregated photos into an array per entry using json_agg.",
            "Enhanced queries to sort photos by description inside the aggregation.",
            "Consolidated queries from multi-step fetches into one optimized query.",
          ]}
        />

        <Phase
          title="Phase 5: Frontend Components"
          items={[
            "Built JournalList and JournalCard React components.",
            "Standardized routing on entry_id (fixed inconsistent id usage).",
            "Fixed typing issues in [entry_id]/page.tsx by correctly extending PageProps.",
            "Styled with shadcn/ui + Tailwind for clean, consistent UI.",
          ]}
        />

        <Phase
          title="Phase 6: Authentication"
          items={[
            "Implemented custom username + password authentication.",
            "Wired authentication through Next.js server actions for seamless login/signup.",
          ]}
        />

        <Phase
          title="Phase 7: Production & Deployment"
          items={[
            "Fixed JSON fetch returning HTML (`<!DOCTYPE>`) during API calls.",
            "Resolved Vercel build errors by correcting TypeScript typings.",
            "Disabled ESLint’s react/no-unescaped-entities rule to allow natural apostrophes in text.",
          ]}
        />

        <Phase
          title="Phase 8: Documentation & DX"
          items={[
            "Wrote a README.md with project overview, features, and tech stack.",
            "Clarified where to store static vs dynamic JSON data (/public vs /app/data).",
          ]}
        />

        <div className="mt-10 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold">✅ Current Status:</p>
          <p>
            Trail Journal App is a full-stack journaling platform with entries,
            photos, authentication, PostgreSQL database, and interactive D3 map
            visualization — deployed and production-ready. 🚀
          </p>
        </div>
      </div>
    </main>
  );
}
