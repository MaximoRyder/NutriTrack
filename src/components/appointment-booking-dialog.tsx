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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { useState } from "react";

interface AppointmentBookingDialogProps {
    nutritionistId: string;
    patientId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

interface AvailableSlot {
    date: string;
    time: string;
    dateTime: Date;
}

export function AppointmentBookingDialog({
    nutritionistId,
    patientId,
    onSuccess,
    trigger,
}: AppointmentBookingDialogProps) {
    const { t, locale } = useTranslation();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [appointmentType, setAppointmentType] = useState<string>("followup");
    const [notes, setNotes] = useState("");
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    const dateLocales = { en: enUS, es: es, pt: ptBR };
    const currentLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;

    const fetchAvailableSlots = async (date: Date) => {
        setIsLoadingSlots(true);
        try {
            // Fetch slots for the selected week
            const startDate = new Date(date);
            startDate.setDate(startDate.getDate() - startDate.getDay());
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 13); // 2 weeks

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
        return availableSlots
            .filter((slot) => slot.date === dateStr)
            .map((slot) => slot.time);
    };

    const handleBook = async () => {
        if (!selectedDate || !selectedTime) {
            toast({
                variant: "destructive",
                title: t("settings.error"),
                description: t("appointments.selectDateTime"),
            });
            return;
        }

        setIsBooking(true);
        try {
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nutritionistId,
                    patientId,
                    date: appointmentDate.toISOString(),
                    duration: 60, // Default 60 minutes
                    type: appointmentType,
                    notes,
                }),
            });

            if (res.ok) {
                toast({
                    title: t("settings.success"),
                    description: t("appointments.bookingSuccess"),
                });
                setIsOpen(false);
                setSelectedDate(undefined);
                setSelectedTime("");
                setNotes("");
                onSuccess?.();
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to book");
            }
        } catch (error: any) {
            console.error("Error booking appointment:", error);
            toast({
                variant: "destructive",
                title: t("settings.error"),
                description: error.message || t("appointments.bookingError"),
            });
        } finally {
            setIsBooking(false);
        }
    };

    const timeSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {t("appointments.book")}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{t("appointments.book")}</DialogTitle>
                    <DialogDescription>
                        {t("appointments.selectDateTimeDesc")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2 py-2 overflow-y-auto flex-1 px-2">
                    {/* Calendar */}
                    <div className="space-y-2">
                        <Label>{t("appointments.selectDate")}</Label>
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                locale={currentLocale}
                                className="rounded-md border"
                                classNames={{
                                    head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100"
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
                                    {t("general.loading")}
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

                    {/* Appointment Type */}
                    <div className="space-y-2">
                        <Label>{t("appointments.appointmentType")}</Label>
                        <Select value={appointmentType} onValueChange={setAppointmentType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="initial">
                                    {t("appointments.types.initial")}
                                </SelectItem>
                                <SelectItem value="followup">
                                    {t("appointments.types.followup")}
                                </SelectItem>
                                <SelectItem value="checkup">
                                    {t("appointments.types.checkup")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>{t("appointments.notes")}</Label>
                        <Textarea
                            placeholder={t("appointments.notesPlaceholder")}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                    >
                        {t("general.cancel")}
                    </Button>
                    <Button
                        onClick={handleBook}
                        disabled={!selectedDate || !selectedTime || isBooking}
                    >
                        {isBooking ? t("general.saving") : t("appointments.book")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
