import Navigation from '@/app/ui/journal/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navigation />
      <div className="flex-grow overflow-y-auto p-6 md:p-12">{children}</div>
    </div>
  );
}