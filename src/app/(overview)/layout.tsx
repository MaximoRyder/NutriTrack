"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSidebarOpen = true;
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const { profile: userProfile, isLoading: isProfileLoading } = useUserProfile(
    (user as any)?.id
  );

  useEffect(() => {
    const loading = isUserLoading || isProfileLoading;
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (!loading && user && userProfile) {
      const needsOnboarding =
        userProfile.role === "patient" &&
        (!userProfile.heightCm || !userProfile.goalWeightKg);
      const currentPath = pathname; // safe to read without adding to deps
      if (needsOnboarding && currentPath !== "/welcome") {
        router.replace("/welcome");
        return;
      }
      if (!needsOnboarding && currentPath === "/welcome") {
        router.replace("/overview");
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t("general.loading")}</p>
      </div>
    );
  }

  // Bloquear acceso si no hay usuario
  if (!user) {
    return null; // El useEffect redirigirá
  }

  // Prevent rendering children if the profile is for a pending nutritionist
  // and they are trying to access a page other than overview or settings.
  // This is a simple client-side guard.
  if (
    userProfile?.role === "nutritionist" &&
    userProfile?.subscriptionStatus === "pending" &&
    !pathname.startsWith("/settings")
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <Logo />
        <h2 className="mt-6 text-xl font-semibold">
          {t("admin.pending.title")}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {t("admin.pending.description")}
        </p>
        <div className="mt-6">
          <UserNav />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <Logo textClassName="text-sidebar-foreground" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <DashboardHeader />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
