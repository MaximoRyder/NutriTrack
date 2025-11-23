"use client";

import { EditAppointmentDialog } from "@/components/edit-appointment-dialog";
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
import { enUS, es, ptBR } from "date-fns/locale";
import { Calendar, Edit, X } from "lucide-react";
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
    patientId: {
        _id: string;
        displayName: string;
        email: string;
        photoUrl?: string;
    };
}

export default function AppointmentsPage() {
    const { user, isUserLoading } = useUser();
    const { profile: userProfile, isLoading: isProfileLoading } = useUserProfile(
        (user as any)?.id
    );
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const dateLocales = { en: enUS, es: es, pt: ptBR };
    const currentLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;

    // Fetch appointments
    const { data: appointments, isLoading: isLoadingAppointments, mutate } = useSWR<Appointment[]>(
        userProfile?.id
            ? `/api/appointments?userId=${userProfile.id}&role=nutritionist`
            : null,
        fetcher
    );

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <p>{t("general.loading")}</p>
            </div>
        );
    }

    // Redirect non-nutritionists
    if (userProfile?.role !== "nutritionist") {
        router.push("/overview");
        return null;
    }

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            const res = await fetch(`/api/appointments?id=${appointmentId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({
                    title: t("settings.success"),
                    description: "Appointment cancelled successfully",
                });
                mutate();
            } else {
                throw new Error("Failed to cancel");
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            toast({
                variant: "destructive",
                title: t("settings.error"),
                description: "Failed to cancel appointment",
            });
        }
    };

    // Split appointments into upcoming and past
    const now = new Date();
    const upcomingAppointments =
        appointments?.filter(
            (a) => a.status !== "cancelled" && new Date(a.date) >= now
        ) || [];
    const pastAppointments =
        appointments?.filter((a) => new Date(a.date) < now) || [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Appointments
                </h2>
                <p className="text-muted-foreground">
                    Manage your patient appointments
                </p>
            </div>

            {/* Upcoming Appointments */}
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>
                        View and manage your scheduled appointments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingAppointments ? (
                        <div>{t("general.loading")}...</div>
                    ) : upcomingAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-sm">No upcoming appointments</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingAppointments.map((appointment) => (
                                    <TableRow key={appointment._id}>
                                        <TableCell className="font-medium">
                                            {appointment.patientId?.displayName || t("general.na")}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(appointment.date), "PPp", {
                                                locale: currentLocale,
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {t(`appointments.types.${appointment.type}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    appointment.status === "confirmed"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {t(`appointments.status.${appointment.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingAppointment(appointment)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCancelAppointment(appointment._id)}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Past Appointments */}
            <Card>
                <CardHeader>
                    <CardTitle>Past Appointments</CardTitle>
                    <CardDescription>History of completed appointments</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingAppointments ? (
                        <div>{t("general.loading")}...</div>
                    ) : pastAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-sm">No past appointments</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pastAppointments.slice(0, 10).map((appointment) => (
                                    <TableRow key={appointment._id}>
                                        <TableCell className="font-medium">
                                            {appointment.patientId?.displayName || t("general.na")}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(appointment.date), "PP", {
                                                locale: currentLocale,
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {t(`appointments.types.${appointment.type}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {t(`appointments.status.${appointment.status}`)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            {editingAppointment && (
                <EditAppointmentDialog
                    appointment={editingAppointment}
                    nutritionistId={userProfile.id}
                    isOpen={!!editingAppointment}
                    onClose={() => setEditingAppointment(null)}
                    onSuccess={() => {
                        mutate();
                        setEditingAppointment(null);
                    }}
                />
            )}
        </div>
    );
}
