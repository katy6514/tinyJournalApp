import Navigation from '@/app/ui/journal/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navigation />
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
}