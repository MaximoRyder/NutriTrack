"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/lib/data-hooks";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "./notification-bell";
import { UserNav } from "./user-nav";

interface DashboardHeaderProps {
  onLinkClick?: () => void;
}

export function DashboardHeader({ onLinkClick }: DashboardHeaderProps) {
  const { user } = useUser();

  return (
    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
      <LanguageSwitcher />
      {user && <NotificationBell />}
      <UserNav onLinkClick={onLinkClick} />
    </div>
  );
}

export function DashboardHeaderWithSidebar() {
  const { setOpenMobile } = useSidebar();
  return <DashboardHeader onLinkClick={() => setOpenMobile(false)} />;
}
