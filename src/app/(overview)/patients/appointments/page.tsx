"use client";

import { AppointmentDetailDialog } from "@/components/appointment-detail-dialog";
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Calendar, Edit, Eye, MoreHorizontal, X } from "lucide-react";
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
    const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

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
                    description: t("appointments.cancelSuccess"),
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
                description: t("appointments.cancelError"),
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
                    {t("appointments.title")}
                </h2>
                <p className="text-muted-foreground">
                    {t("appointments.subtitle")}
                </p>
            </div>

            {/* Upcoming Appointments */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("appointments.upcomingTitle")}</CardTitle>
                    <CardDescription>
                        {t("appointments.upcomingDesc")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingAppointments ? (
                        <div>{t("general.loading")}...</div>
                    ) : upcomingAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-sm">{t("appointments.noUpcoming")}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("appointments.table.patient")}</TableHead>
                                    <TableHead>{t("appointments.table.dateTime")}</TableHead>
                                    <TableHead className="text-right">{t("appointments.table.actions")}</TableHead>
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
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t("appointments.table.actions")}</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => setViewingAppointment(appointment)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t("journal.view")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setEditingAppointment(appointment)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        {t("journal.edit")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setAppointmentToCancel(appointment)}
                                                        className="text-destructive"
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        {t("appointments.cancel")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                    <CardTitle>{t("appointments.pastTitle")}</CardTitle>
                    <CardDescription>{t("appointments.pastDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingAppointments ? (
                        <div>{t("general.loading")}...</div>
                    ) : pastAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-sm">{t("appointments.noPast")}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("appointments.table.patient")}</TableHead>
                                    <TableHead>{t("appointments.table.dateTime")}</TableHead>
                                    <TableHead className="text-right">{t("appointments.table.actions")}</TableHead>
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
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t("appointments.table.actions")}</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => setViewingAppointment(appointment)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t("journal.view")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            {viewingAppointment && (
                <AppointmentDetailDialog
                    appointment={viewingAppointment}
                    isOpen={!!viewingAppointment}
                    onClose={() => setViewingAppointment(null)}
                />
            )}

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

            <AlertDialog open={!!appointmentToCancel} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("appointments.deleteDialog.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("appointments.deleteDialog.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("appointments.deleteDialog.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (appointmentToCancel) {
                                    handleCancelAppointment(appointmentToCancel._id);
                                    setAppointmentToCancel(null);
                                }
                            }}
                        >
                            {t("appointments.deleteDialog.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
