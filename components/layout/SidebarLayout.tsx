"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Users, ShoppingBag, Settings, Compass, DollarSign, QrCode, LogOut } from "lucide-react";

interface SidebarLayoutProps {
  role: "brand" | "influencer";
}

export default function SidebarLayout({ role }: SidebarLayoutProps) {
  const pathname = usePathname();

  const brandMenus = [
    { label: "대시보드", href: "/brand/dashboard", icon: LayoutDashboard },
    { label: "캠페인", href: "/brand/campaigns", icon: Megaphone },
    { label: "인플루언서", href: "/brand/influencers", icon: Users },
    { label: "쇼핑", href: "/brand/shopping", icon: ShoppingBag },
    { label: "설정", href: "/brand/settings", icon: Settings },
  ];

  const influencerMenus = [
    { label: "대시보드", href: "/influencer/dashboard", icon: LayoutDashboard },
    { label: "캠페인탐색", href: "/influencer/explore", icon: Compass },
    { label: "내캠페인", href: "/influencer/my-campaigns", icon: Megaphone },
    { label: "수익", href: "/influencer/earnings", icon: DollarSign },
    { label: "내코드", href: "/influencer/my-code", icon: QrCode },
  ];

  const menus = role === "brand" ? brandMenus : influencerMenus;

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-screen bg-olive-dark text-white fixed top-0 left-0 bottom-0 z-50">
      <div className="p-6">
        <h1 className="font-serifDisplay text-3xl font-bold tracking-wider text-white">anting</h1>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2 overflow-y-auto">
        {menus.map((menu) => {
          const isActive = pathname === menu.href || pathname.startsWith(menu.href + "/");
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-olive text-white font-medium shadow-sm"
                  : "text-white/70 hover:bg-olive/40 hover:text-white"
              }`}
            >
              <menu.icon size={20} className={isActive ? "text-white" : "text-white/70"} />
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-olive-light flex items-center justify-center text-white font-bold">
            {role === "brand" ? "B" : "I"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{role === "brand" ? "브랜드 관리자" : "인플루언서"}</p>
            <p className="text-xs text-white/50 truncate">example@anting.com</p>
          </div>
        </div>
        <button className="flex items-center gap-3 w-full px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          <LogOut size={20} />
          <span className="text-sm">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
