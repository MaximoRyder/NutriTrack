"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import {
  AreaChart,
  BookCopy,
  Calendar,
  LayoutDashboard,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const { profile: userProfile, isLoading: isProfileLoading } = useUserProfile(
    (user as any)?.id
  );
  const { t } = useTranslation();

  const patientNav = [
    { name: t("sidebar.overview"), href: "/overview", icon: LayoutDashboard },
    { name: t("sidebar.foodJournal"), href: "/journal", icon: Calendar },
    { name: t("sidebar.myProgress"), href: "/progress", icon: AreaChart },
    { name: t("sidebar.mealPlan"), href: "/plan", icon: BookCopy },
    {
      name: t("sidebar.myNutritionist"),
      href: "/nutritionist",
      icon: Stethoscope,
    },
  ];

  const nutritionistNav = [
    { name: t("sidebar.overview"), href: "/overview", icon: LayoutDashboard },
    { name: t("sidebar.myPatients"), href: "/patients", icon: Users },
  ];

  const adminNav = [
    { name: t("sidebar.overview"), href: "/overview", icon: LayoutDashboard },
    { name: t("sidebar.userManagement"), href: "/admin", icon: Shield },
  ];

  const getNavItems = () => {
    switch (userProfile?.role) {
      case "nutritionist":
        return nutritionistNav;
      case "admin":
        return adminNav;
      case "patient":
      default:
        return patientNav;
    }
  };

  const navItems = getNavItems();
  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <SidebarMenu>
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton>
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            : navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton
                      isActive={
                        pathname.startsWith(item.href) &&
                        (item.href !== "/overview" || pathname === "/overview")
                      }
                      tooltip={item.name}
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
        </SidebarMenu>
      </div>
      <div className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton
                isActive={pathname.startsWith("/settings")}
                tooltip={t("sidebar.settings")}
              >
                <Settings />
                <span>{t("sidebar.settings")}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </div>
  );
}
