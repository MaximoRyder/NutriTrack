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
                description: "Please select a date and time",
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
                    description: "Appointment updated successfully",
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
                description: error.message || "Failed to update appointment",
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
                    <DialogTitle>Edit Appointment</DialogTitle>
                    <DialogDescription>
                        Change the date or time of this appointment
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Calendar */}
                    <div className="space-y-2">
                        <Label>Select Date</Label>
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                locale={currentLocale}
                                className="rounded-md border"
                            />
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                        <div className="space-y-2">
                            <Label>Select Time</Label>
                            {isLoadingSlots ? (
                                <div className="text-sm text-muted-foreground">
                                    {t("general.loading")}...
                                </div>
                            ) : timeSlots.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    No available slots for this date
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
                        {isSaving ? t("general.saving") : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
