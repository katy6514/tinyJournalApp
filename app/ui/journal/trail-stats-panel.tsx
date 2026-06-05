import { notoSans } from "@/app/ui/fonts";

interface TrailStats {
  total_entries: number;
  total_days: number;
  total_mileage: number;
  total_photos: number;
}

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className={`${notoSans.className} text-2xl font-bold`}>{value}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
  </div>
);

export default function TrailStatsPanel({ stats }: { stats: TrailStats }) {
  return (
    <div className="card bg-base-100 dark:bg-gray-700 shadow-sm border border-base-200 dark:border-gray-600">
      <div className="card-body p-5">
        <h3 className={`${notoSans.className} text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3`}>
          Trail Stats
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Stat value={stats.total_entries.toLocaleString()} label="entries written" />
          <Stat value={`${stats.total_mileage.toLocaleString()} mi`} label="miles hiked" />
          <Stat value={stats.total_photos.toLocaleString()} label="photos" />
          <Stat value={stats.total_days.toLocaleString()} label="days on trail" />
        </div>
      </div>
    </div>
  );
}
