import SidebarLayout from "@/components/layout/SidebarLayout";
import BottomTabBar from "@/components/layout/BottomTabBar";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral">
      <SidebarLayout role="brand" />
      <main className="md:pl-[240px] pb-[68px] md:pb-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <BottomTabBar role="brand" />
    </div>
  );
}
