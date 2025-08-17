"use client";

import { useState } from "react";

import { EditEntry } from "@/app/ui/journal/buttons";
import { lusitana } from "@/app/ui/fonts";

import { JournalEntry } from "@/app/lib/definitions";
import { Button } from "../../button";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { date, date_id, id, text, legname, state } = entry;

  const timeZoneCorrectedDate = new Date(date + "T00:00:00").toDateString();
  return (
    <>
      <div
        key={date_id}
        className="grid grid-cols-3 grid-rows-4 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600"
      >
        <div className="row-span-4 p-4 bg-white dark:bg-gray-700">
          eventual image
        </div>
        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-semibold">
            {legname} - {state}
          </p>
        </div>
        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-500">{timeZoneCorrectedDate}</p>
        </div>
        <div className="col-span-2 row-span-2  p-4 bg-white dark:bg-gray-800">
          <p className={`${lusitana.className} font-medium truncate`}>{text}</p>
        </div>
        <div className="col-span-2 row-span-1">
          {/* <Button href={`/journal/${id}`} variant="dark">
          View
        </Button> */}
          {/* <!-- Modal toggle --> */}
          <Button onClick={() => setIsModalOpen(true)} variant="dark">
            View
          </Button>
          <EditEntry id={id} />
        </div>
      </div>

      {/* <!-- Main modal --> */}
      {isModalOpen && (
        <div
          id="default-modal"
          tabIndex={-1}
          aria-hidden="true"
          className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
        >
          <div className="relative p-4 w-full max-w-2xl max-h-full">
            {/* <!-- Modal content --> */}
            <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
              {/* <!-- Modal header --> */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Terms of Service
                </h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              {/* <!-- Modal body --> */}
              <div className="p-4 md:p-5 space-y-4">
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  text
                </p>
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  text
                </p>
              </div>
              {/* <!-- Modal footer --> */}
              <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  I accept
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                  className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
