"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import Link from "next/link";
import { DashboardHeader } from "./dashboard-header";

export function Header() {
  const { t } = useTranslation();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 sm:px-6">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo textClassName="text-foreground" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center gap-2">
            {user ? (
              <DashboardHeader />
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/login">{t("header.login")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("header.signUp")}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
