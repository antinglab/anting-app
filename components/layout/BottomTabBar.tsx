"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Megaphone, Bell, User, Compass, DollarSign } from "lucide-react";

interface BottomTabBarProps {
  role: "brand" | "influencer";
}

export default function BottomTabBar({ role }: BottomTabBarProps) {
  const pathname = usePathname();

  const brandTabs = [
    { label: "홈", href: "/brand/dashboard", icon: Home },
    { label: "캠페인", href: "/brand/campaigns", icon: Megaphone },
    { label: "알림", href: "/brand/notifications", icon: Bell },
    { label: "마이", href: "/brand/settings", icon: User },
  ];

  const influencerTabs = [
    { label: "홈", href: "/influencer/dashboard", icon: Home },
    { label: "탐색", href: "/influencer/explore", icon: Compass },
    { label: "수익", href: "/influencer/earnings", icon: DollarSign },
    { label: "마이", href: "/influencer/my-page", icon: User },
  ];

  const tabs = role === "brand" ? brandTabs : influencerTabs;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-gray-100 flex items-center justify-around z-50 pb-safe">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            <tab.icon
              size={24}
              className={`transition-colors ${isActive ? "text-olive" : "text-gray-400"}`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-olive" : "text-gray-400"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
