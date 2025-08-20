import CDTmap from "./CDTmap";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "The Map",
            href: `/journal/map`,
            active: true,
          },
        ]}
      />
      <CDTmap />
      <div>
        <section>
          <header>
            <h3>Helpful Hints</h3>
          </header>
          <div>
            <ul>
              <li>Click once to zoom in on a state</li>
              <li>Double click to increase zoom</li>
              <li>Click and drag to pan</li>
              <li>Click outside state lines to reset zoom</li>
              <li>Hover over the photo points to see the photo</li>
            </ul>
          </div>
        </section>
      </div>
      <div
        id="tooltip"
        role="tooltip"
        className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-xs opacity-0 tooltip dark:bg-gray-700"
      ></div>
    </main>
  );
}
