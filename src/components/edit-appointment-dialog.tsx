"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface EditAppointmentDialogProps {
    appointment: {
        _id: string;
        date: string;
        duration: number;
        type: string;
        notes?: string;
    };
    nutritionistId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface AvailableSlot {
    date: string;
    time: string;
    dateTime: Date;
}

export function EditAppointmentDialog({
    appointment,
    nutritionistId,
    isOpen,
    onClose,
    onSuccess,
}: EditAppointmentDialogProps) {
    const { t, locale } = useTranslation();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const dateLocales = { en: enUS, es: es, pt: ptBR };
    const currentLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;

    useEffect(() => {
        if (isOpen && appointment) {
            const appointmentDate = new Date(appointment.date);
            setSelectedDate(appointmentDate);
            setSelectedTime(format(appointmentDate, "HH:mm"));
            fetchAvailableSlots(appointmentDate);
        }
    }, [isOpen, appointment]);

    const fetchAvailableSlots = async (date: Date) => {
        setIsLoadingSlots(true);
        try {
            const startDate = new Date(date);
            startDate.setDate(startDate.getDate() - startDate.getDay());
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 13);

            const res = await fetch(
                `/api/available-slots?nutritionistId=${nutritionistId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );

            if (res.ok) {
                const slots = await res.json();
                setAvailableSlots(slots);
            }
        } catch (error) {
            console.error("Error fetching available slots:", error);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        setSelectedTime("");
        if (date) {
            fetchAvailableSlots(date);
        }
    };

    const getTimeSlotsForDate = (date: Date): string[] => {
        const dateStr = format(date, "yyyy-MM-dd");
        const currentAppointmentTime = format(new Date(appointment.date), "HH:mm");
        const currentAppointmentDate = format(new Date(appointment.date), "yyyy-MM-dd");

        const slots = availableSlots
            .filter((slot) => slot.date === dateStr)
            .map((slot) => slot.time);

        // Include the current appointment time if it's the same date
        if (dateStr === currentAppointmentDate && !slots.includes(currentAppointmentTime)) {
            slots.push(currentAppointmentTime);
            slots.sort();
        }

        return slots;
    };

    const handleSave = async () => {
        if (!selectedDate || !selectedTime) {
            toast({
                variant: "destructive",
                title: t("settings.error"),
                description: t("appointments.selectDateTimeError"),
            });
            return;
        }

        setIsSaving(true);
        try {
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours, minutes, 0, 0);

            const res = await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: appointment._id,
                    date: newDate.toISOString(),
                }),
            });

            if (res.ok) {
                toast({
                    title: t("settings.success"),
                    description: t("appointments.updateSuccess"),
                });
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to update");
            }
        } catch (error: any) {
            console.error("Error updating appointment:", error);
            toast({
                variant: "destructive",
                title: t("settings.error"),
                description: error.message || t("appointments.updateError"),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const timeSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t("appointments.editTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("appointments.editDesc")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Calendar */}
                    <div className="space-y-2">
                        <Label>{t("appointments.selectDate")}</Label>
                        <div className="flex justify-center mt-4 mb-4">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                locale={currentLocale}
                                className="rounded-md border"
                                classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-base font-medium",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.9rem]",
                                    row: "flex w-full mt-2",
                                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                    day_disabled: "text-muted-foreground opacity-50",
                                    day_hidden: "invisible",
                                }}
                            />
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                        <div className="space-y-2">
                            <Label>{t("appointments.selectTime")}</Label>
                            {isLoadingSlots ? (
                                <div className="text-sm text-muted-foreground">
                                    {t("general.loading")}...
                                </div>
                            ) : timeSlots.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    {t("appointments.noAvailableSlots")}
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {timeSlots.map((time) => (
                                        <Button
                                            key={time}
                                            type="button"
                                            variant={selectedTime === time ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedTime(time)}
                                            className="text-xs"
                                        >
                                            <Clock className="h-3 w-3 mr-1" />
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("general.cancel")}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedDate || !selectedTime || isSaving}
                    >
                        {isSaving ? t("general.saving") : t("appointments.saveChanges")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
