import Navigation from '@/app/ui/journal/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navigation />
      <div className="relative flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-800 px-6 py-8 md:px-10">{children}</div>
    </div>
  );
}