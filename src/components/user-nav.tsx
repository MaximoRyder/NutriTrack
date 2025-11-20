"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { BarChart3, LogOut, Settings, Shield, User, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UserNav() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile: userProfile } = useUserProfile((user as any)?.id);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const renderMenuItems = () => {
    switch (userProfile?.role) {
      case "admin":
        return (
          <Link href="/admin">
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>{t("sidebar.userManagement")}</span>
            </DropdownMenuItem>
          </Link>
        );
      case "nutritionist":
        return (
          <>
            <Link href="/overview">
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>{t("sidebar.overview")}</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/patients">
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                <span>{t("sidebar.patients")}</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t("userNav.profile")}</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t("userNav.settings")}</span>
              </DropdownMenuItem>
            </Link>
          </>
        );
      case "patient":
      default:
        return (
          <>
            <Link href="/settings">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t("userNav.profile")}</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t("userNav.settings")}</span>
              </DropdownMenuItem>
            </Link>
          </>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                userProfile?.photoUrl ||
                (user as any)?.photoURL ||
                "https://picsum.photos/seed/user-avatar/40/40"
              }
              alt="User avatar"
              data-ai-hint="person portrait"
            />
            <AvatarFallback>
              {userProfile?.displayName
                ? userProfile.displayName.charAt(0)
                : (user as any)?.name
                ? (user as any).name.charAt(0)
                : "P"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userProfile?.displayName ||
                (user as any)?.name ||
                t("userNav.patientName")}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {(user as any)?.email || t("userNav.patientEmail")}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>{renderMenuItems()}</DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("userNav.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
