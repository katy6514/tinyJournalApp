// import { Card } from '@/app/ui/journal/cards';
// import RevenueChart from '@/app/ui/dashboard/revenue-chart';
// import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";

import { sourceSans } from "@/app/ui/fonts";

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "About", href: "/journal", active: true },
          // {
          //   label: "View Entry",
          //   href: `/journal/`,
          //   active: true,
          // },
        ]}
      />
      <div className="">
        <p>
          In the summer of 2024, I started a ~3000 mile long journey on the
          Continental Divide Trail down the Rocky Mountains. I started in
          Montana at the Canadian border and walked south for the next 5 months.
          Along the way I took pictures, wrote in my journal, sent messages to
          loved ones with the use of a satellite communicator and saved the
          locations of my campsites. This page is my process of combining all
          those parts of my trip into one data visualization.
        </p>
        <p>
          If something seems buggy/unusable, it probably is! This is still very
          much a work in progress, and something I'm playing aorund with in my
          spare time.
        </p>
        <p>
          I carried a Garmin Inreach Mini 2 on my trip. Most messages I sent
          also contained location. These are mapped above in the data vis as red
          dots. you can hover to see the date the message was sent
        </p>
        <p>
          Every night once I found my campsite, I sent a preset message to
          family. When analyzing my garmin data I flagged these preset messages
          and color coded them blue in the datavis.
        </p>
        <p>
          My daily miles hiked, routes generated after the hike with CalTopo.
          These are mapped in the datavis in alternating blue and orange lines.
          Hover over the leg in the datavis to see the name (or at least what
          I'm calling it). I saved the location of my nightly campsites with my
          garmin. I did not record my walks each day with the garmin becuase I
          didn't want to drain the battery. Instead I used the saved locations
          of my campsites and recreated the route I took each day with Caltopo.
          I then exported those tracks as GeoJSON and uploaded them here.
        </p>
        <p>
          Wanna Get in Touch? Want to talk about the trail? Gear? Code? A job?
          :D Shoot me an email at katy6514 [at] gmail [dot] com. I'd love to
          hear from you!
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        {/* <RevenueChart revenue={revenue}  /> */}
        {/* <LatestInvoices latestInvoices={latestInvoices} /> */}
      </div>
    </main>
  );
}
