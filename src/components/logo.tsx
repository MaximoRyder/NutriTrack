"use client";

import { useTranslation } from '@/lib/i18n/i18n-provider';
import { cn } from '@/lib/utils';
import { Leaf } from 'lucide-react';

export function Logo({ className, textClassName }: { className?: string, textClassName?: string }) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Leaf className="h-6 w-6 text-primary" />
      <h1 className={cn("font-headline text-xl font-semibold", textClassName)}>{t("header.appName")}</h1>
    </div>
  );
}
