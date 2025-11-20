"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { UserRole } from "@/lib/types";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { mutate } from "swr";

interface UserListItem {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  createdAt?: string;
  subscriptionStatus?: "active" | "inactive" | "pending" | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

  const { data: users, isLoading: isLoadingUsers } = useSWR<UserListItem[]>(
    "/api/users",
    fetcher
  );

  const handleUpdateStatus = async (
    userId: string,
    newStatus: "active" | "inactive" | "pending"
  ) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, subscriptionStatus: newStatus }),
      });

      if (!response.ok) throw new Error("Error al actualizar estado");

      mutate("/api/users");
      toast({
        title: t("admin.statusUpdated"),
        description: t("admin.statusUpdatedDesc").replace(
          "{status}",
          t(`admin.status.${newStatus}` as any)
        ),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (!response.ok) throw new Error("Error al actualizar rol");

      mutate("/api/users");
      toast({
        title: t("admin.roleUpdated"),
        description: t("admin.roleUpdatedDesc").replace(
          "{role}",
          t(`roles.${newRole}` as any)
        ),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users?id=${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar usuario");

      mutate("/api/users");
      toast({
        title: t("admin.userDeleted"),
        description: t("admin.userDeletedDesc").replace(
          "{email}",
          userToDelete.email
        ),
      });
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.delete.description").replace(
                "{email}",
                userToDelete?.email || ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/80"
            >
              {t("admin.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("admin.userManagement")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.userManagementDesc")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.allUsers")}</CardTitle>
            <CardDescription>{t("admin.allUsersDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.table.user")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("admin.table.role")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("admin.table.registered")}
                  </TableHead>
                  <TableHead>{t("admin.table.status")}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t("admin.table.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/${user.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={user.photoUrl}
                              alt={user.displayName}
                            />
                            <AvatarFallback>
                              {user.displayName
                                ? user.displayName.charAt(0)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize">
                        {t(`roles.${user.role}` as any)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "PP")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {user.role === "nutritionist" ? (
                          <Badge
                            variant={
                              user.subscriptionStatus === "pending"
                                ? "destructive"
                                : "default"
                            }
                            className="capitalize"
                          >
                            {t(
                              `admin.status.${user.subscriptionStatus}` as any
                            )}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                {t("admin.table.toggleMenu")}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuLabel>
                              {t("admin.table.actions")}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/${user.id}`)}
                            >
                              {t("admin.actions.edit")}
                            </DropdownMenuItem>
                            {user.role === "nutritionist" && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  {t("admin.actions.updateStatus")}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(user.id, "active")
                                    }
                                  >
                                    {t("admin.actions.approve")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(user.id, "inactive")
                                    }
                                  >
                                    {t("admin.actions.deactivate")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(user.id, "pending")
                                    }
                                  >
                                    {t("admin.actions.setPending")}
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                {t("admin.actions.changeRole")}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(user.id, "patient")
                                  }
                                >
                                  {t("roles.patient")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(user.id, "nutritionist")
                                  }
                                >
                                  {t("roles.nutritionist")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(user.id, "admin")
                                  }
                                >
                                  {t("roles.admin")}
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setUserToDelete(user)}
                            >
                              {t("admin.actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("admin.noUsers")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
