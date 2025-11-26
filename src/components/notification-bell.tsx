"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationRead,
  useNotifications,
  useUser,
} from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { Notification } from "@/lib/types";
import { Bell, CheckCircle, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { user } = useUser();
  const router = useRouter();
  const { locale } = useTranslation();

  const { notifications, mutate } = useNotifications();

  const unreadCount =
    notifications?.filter((n: Notification) => !n.read).length || 0;

  const handleOpenNotification = async (n: Notification) => {
    await markNotificationRead(n.id);
    mutate();
    if (n.mealDate) {
      router.push(`/journal?date=${n.mealDate}&mealId=${n.mealId}`);
    } else {
      router.push(`/journal/${n.mealId}?fromNotification=1`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={0}
        className="w-screen h-[calc(100vh-4rem)] sm:w-80 sm:h-auto overflow-y-auto rounded-none border-0 sm:rounded-md sm:border p-0"
      >
        <div className="px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
          <MessageSquare className="h-4 w-4" /> Notificaciones
        </div>
        {notifications?.length === 0 && (
          <div className="px-4 py-8 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 text-center">
            <CheckCircle className="h-8 w-8 text-green-500/50" />
            <p>No tienes notificaciones pendientes</p>
          </div>
        )}
        {notifications &&
          notifications.map((n: Notification) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className={`flex items-start gap-3 cursor-pointer border-b border-border/50 last:border-0 p-4 transition-colors ${n.read
                ? "bg-background"
                : "bg-green-50/50 dark:bg-green-900/10"
                }`}
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium leading-none truncate">
                    {n.fromName}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString(
                      locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-ES",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}{" "}
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p
                  className="text-xs text-muted-foreground break-words leading-5"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {n.mealName && (
                    <span className="font-medium text-foreground/80">
                      En <strong>{n.mealName}</strong>:{" "}
                    </span>
                  )}
                  {n.textPreview}
                </p>
              </div>
              {!n.read && (
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
