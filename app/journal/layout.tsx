import SideNav from '@/app/ui/journal/sidenav';
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <SideNav />
      <div className="flex-grow overflow-y-auto p-6 md:p-12">{children}</div>
    </div>
  );
}