"use client";

import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
