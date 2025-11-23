"use client";

import { AppointmentBookingDialog } from "@/components/appointment-booking-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { Calendar, Mail, MessageSquare, Phone, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Appointment {
  _id: string;
  date: string;
  type: "initial" | "followup" | "checkup";
  duration: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  nutritionistId: any;
  patientId: any;
}

export default function NutritionistPage() {
  const { user, isUserLoading } = useUser();
  const {
    profile: userProfile,
    isLoading: isProfileLoading,
    mutate: mutateProfile,
  } = useUserProfile((user as any)?.id);
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [invitationCode, setInvitationCode] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch nutritionist data
  const { profile: nutritionist, isLoading: isLoadingNutritionist } =
    useUserProfile(userProfile?.assignedNutritionistId || "");

  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments, mutate: mutateAppointments } = useSWR<Appointment[]>(
    userProfile?.id
      ? `/api/appointments?userId=${userProfile.id}&role=patient`
      : null,
    fetcher
  );

  const isLoading = isUserLoading || isProfileLoading;

  const handleAssignNutritionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim() || !userProfile) return;

    setIsAssigning(true);
    try {
      const res = await fetch("/api/users/assign-by-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode: invitationCode.trim() }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast({
          variant: "destructive",
          title: t("nutritionist.assignError"),
          description: errorText,
        });
        setIsAssigning(false);
        return;
      }

      toast({
        title: t("settings.success"),
        description: t("nutritionist.assignSuccess"),
      });
      mutateProfile();
      setInvitationCode("");
    } catch (error) {
      console.error("Error assigning nutritionist:", error);
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("nutritionist.assignError"),
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <p>{t("general.loading")}</p>
      </div>
    );
  }

  // Redirect non-patients
  if (userProfile?.role !== "patient") {
    router.push("/overview");
    return null;
  }

  // No nutritionist assigned
  if (!userProfile.assignedNutritionistId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("nutritionist.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("nutritionist.description")}
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("nutritionist.noNutritionist")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {t("nutritionist.noNutritionistDesc")}
            </p>
            <form
              onSubmit={handleAssignNutritionist}
              className="w-full max-w-md space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="invitationCode">
                  {t("nutritionist.enterInvitationCode")}
                </Label>
                <Input
                  id="invitationCode"
                  placeholder={t("nutritionist.invitationCodePlaceholder")}
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  disabled={isAssigning}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isAssigning || !invitationCode.trim()}
                >
                  {isAssigning
                    ? t("nutritionist.assigning")
                    : t("nutritionist.assign")}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings">{t("nutritionist.goToSettings")}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Split appointments into upcoming and past
  const now = new Date();
  const upcomingAppointments =
    appointments?.filter((a) => a.status !== "cancelled" && new Date(a.date) >= now) || [];
  const pastAppointments = appointments?.filter((a) => new Date(a.date) < now) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("nutritionist.title")}
        </h2>
        <p className="text-muted-foreground">{t("nutritionist.description")}</p>
      </div>

      {/* Nutritionist Info Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 space-y-0">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={nutritionist?.photoUrl || ""}
              alt={nutritionist?.displayName}
            />
            <AvatarFallback>
              {nutritionist?.displayName
                ? nutritionist.displayName.charAt(0)
                : "N"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 grid gap-1">
            <CardTitle className="text-2xl">
              {isLoadingNutritionist ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                nutritionist?.displayName || t("general.na")
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {isLoadingNutritionist ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <>
                  <Badge variant="secondary">{t("roles.nutritionist")}</Badge>
                  {nutritionist?.invitationCode && (
                    <span className="text-xs text-muted-foreground">
                      Código: {nutritionist.invitationCode}
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <AppointmentBookingDialog
              nutritionistId={userProfile.assignedNutritionistId}
              patientId={userProfile.id}
              onSuccess={() => mutateAppointments()}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("nutritionist.contact")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("nutritionist.email")}:
                </span>
                {isLoadingNutritionist ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <a
                    href={`mailto:${nutritionist?.email}`}
                    className="hover:underline"
                  >
                    {nutritionist?.email}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("nutritionist.phone")}:
                </span>
                {isLoadingNutritionist ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <span>{t("general.na")}</span>
                )}
              </div>
            </div>
          </div>

          {/* About / Bio (if available) */}
          {nutritionist?.healthConditions && (
            <div>
              <h3 className="font-semibold mb-2">{t("nutritionist.about")}</h3>
              <p className="text-sm text-muted-foreground">
                {nutritionist.healthConditions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("nutritionist.upcomingSessions")}</CardTitle>
            <CardDescription>
              {t("nutritionist.sessionsDesc").replace(
                "{name}",
                nutritionist?.displayName || ""
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <Skeleton className="h-32 w-full" />
            ) : upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">
                  {t("nutritionist.noUpcomingSessions")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nutritionist.sessionDate")}</TableHead>
                    <TableHead>{t("nutritionist.sessionType")}</TableHead>
                    <TableHead>{t("nutritionist.sessionDuration")}</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map((appointment) => {
                    const appointmentDate = new Date(appointment.date);
                    const now = new Date();
                    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const canCancel = hoursUntilAppointment > 24;

                    return (
                      <TableRow key={appointment._id}>
                        <TableCell className="font-medium">
                          {format(new Date(appointment.date), "PPp")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`appointments.types.${appointment.type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{appointment.duration} min</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canCancel}
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/appointments?id=${appointment._id}`, {
                                  method: "DELETE",
                                });
                                if (res.ok) {
                                  toast({
                                    title: t("settings.success"),
                                    description: "Appointment cancelled",
                                  });
                                  mutateAppointments();
                                }
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: t("settings.error"),
                                  description: "Failed to cancel appointment",
                                });
                              }
                            }}
                            title={!canCancel ? "Cannot cancel within 24 hours of appointment" : "Cancel appointment"}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Past Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("nutritionist.pastSessions")}</CardTitle>
            <CardDescription>
              {t("nutritionist.sessionsDesc").replace(
                "{name}",
                nutritionist?.displayName || ""
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <Skeleton className="h-32 w-full" />
            ) : pastAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">{t("nutritionist.noPastSessions")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nutritionist.sessionDate")}</TableHead>
                    <TableHead>{t("nutritionist.sessionType")}</TableHead>
                    <TableHead>{t("nutritionist.sessionDuration")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAppointments.slice(0, 5).map((appointment) => (
                    <TableRow key={appointment._id}>
                      <TableCell className="font-medium">
                        {format(new Date(appointment.date), "PP")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`appointments.types.${appointment.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{appointment.duration} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
