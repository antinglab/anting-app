import SidebarLayout from "@/components/layout/SidebarLayout";
import BottomTabBar from "@/components/layout/BottomTabBar";

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral">
      <SidebarLayout role="influencer" />
      <main className="md:pl-[240px] pb-[68px] md:pb-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <BottomTabBar role="influencer" />
    </div>
  );
}
