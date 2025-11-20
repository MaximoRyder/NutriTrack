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
import type { Notification } from "@/lib/types";
import { Bell, CheckCircle, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { user } = useUser();
  const router = useRouter();

  const { notifications, mutate } = useNotifications();

  const unreadCount = notifications?.length || 0;

  const handleOpenNotification = async (n: Notification) => {
    await markNotificationRead(n.id);
    mutate();
    router.push(`/journal/${n.mealId}?fromNotification=1`);
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
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-2 text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Notificaciones
        </div>
        {unreadCount === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Sin pendientes
          </div>
        )}
        {notifications &&
          notifications.map((n: Notification) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className="flex flex-col items-start gap-1 cursor-pointer"
            >
              <span className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-sm">
                <strong>{n.fromName}:</strong> {n.textPreview}
              </span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
