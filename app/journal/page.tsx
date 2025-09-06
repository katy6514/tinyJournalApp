import Image from "next/image";

import smile from "@/public/smile.jpg";

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
      {/* <div className="max-w-5xl mx-auto p-6"> */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Text Section */}
        <div className="md:w-2/3 text-gray-800 dark:text-gray-50 space-y-4">
          <h3 className="text-lg font-semibold mb-2">
            The Continental Divide Trail
          </h3>
          <p>
            In the summer of 2024, I started a ~3000 mile long journey on the
            Continental Divide Trail down the Rocky Mountains. I started in
            Montana at the Canadian border and walked south for the next 5
            months. Along the way I took pictures, wrote in my journal, sent
            messages to loved ones with the use of a satellite communicator and
            saved the locations of my campsites. This page is my process of
            combining all those parts of my trip into one data visualization.
          </p>
          <p>
            If something seems buggy/unusable, it probably is! This is still
            very much a work in progress, and something I'm playing around with
            in my spare time.
          </p>
          {/* <h3 className="text-lg font-semibold mb-2">GPS Device</h3>
          <p>
            I carried a Garmin Inreach Mini 2 on my trip in case of emergencies
            but also to keep loved ones at home updated on my progress (and to
            assure them I was still having fun). After my trip was over, I
            exorted my data from Garmin's website and wrote a script to extract
            the subset of data I wanted to map, including date, time, lat, long,
            and message content. I then mapped these in the data vis.{" "}
          </p>
          <p>
            Every night on the trail, I also sent a preset message along the
            lines of "camped here for the night!" I was able to filter these
            messages out and mapped those with a different symbol in the data
            visualization.
          </p>
          <h3 className="text-lg font-semibold mb-2">Photos</h3>
          <p>
            I used Exif to extract location data from my photos, similar to the
            data I extracted from my GPS device. I then mapped these photos in
            the data visualization, using the date and time of the photo to
            determine which day it was taken on. Using the each photo's mappe
          </p>
          <h3 className="text-lg font-semibold mb-2">CalTopo</h3>
          <p>
            I did not use my GPS device to track my daily mileage as this would
            run through the devices battery. Instead, after the trail I used
            CalTopo to track the course of my progress each day based on the
            locations of my campsites. I then exported these tracks as GeoJSON
            and uploaded them to the data vis, alternating the colors to
            distinguish between individual days.
          </p> */}
          {/* <h3 className="text-lg font-semibold mb-2">Thanks for visiting!</h3> */}

          <p>
            If you're curious about the process of building this app, check out
            the Dev Journal linked in the sidebar.
          </p>
          <h3 className="text-lg font-semibold mb-2">Thanks for visiting!</h3>

          <p>
            Wanna Get in Touch? Want to talk about the trail? Gear? Code? A job?
            :D Shoot me an email at katy6514 [at] gmail [dot] com. I'd love to
            hear from you!
          </p>
        </div>

        {/* Image Section */}
        <div className="md:w-1/3 flex-shrink-0">
          <Image
            src={smile}
            width={394}
            height={700}
            alt="Photo of Katy laughing sitting on the ground"
            className="rounded-lg object-cover w-full h-auto shadow-md"
          />
        </div>
      </div>
      {/* </div> */}
    </main>
  );
}
