"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TimeRange {
    startTime: string;
    endTime: string;
}

interface DayAvailability {
    enabled: boolean;
    ranges: TimeRange[];
}

interface WeeklyAvailability {
    [key: number]: DayAvailability; // 0-6 for Sunday-Saturday
}

interface AvailabilityManagerProps {
    nutritionistId: string;
}

export function AvailabilityManager({ nutritionistId }: AvailabilityManagerProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [slotDuration, setSlotDuration] = useState(60);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const daysOfWeek = [
        { value: 0, label: t("availability.days.sunday"), shortLabel: "Sun" },
        { value: 1, label: t("availability.days.monday"), shortLabel: "Mon" },
        { value: 2, label: t("availability.days.tuesday"), shortLabel: "Tue" },
        { value: 3, label: t("availability.days.wednesday"), shortLabel: "Wed" },
        { value: 4, label: t("availability.days.thursday"), shortLabel: "Thu" },
        { value: 5, label: t("availability.days.friday"), shortLabel: "Fri" },
        { value: 6, label: t("availability.days.saturday"), shortLabel: "Sat" },
    ];

    const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = i % 2 === 0 ? "00" : "30";
        return `${String(hours).padStart(2, "0")}:${minutes}`;
    });

    const durationOptions = [
        { value: 15, label: "15 min" },
        { value: 30, label: "30 min" },
        { value: 45, label: "45 min" },
        { value: 60, label: "60 min" },
        { value: 90, label: "90 min" },
    ];

    // Initialize with default availability (all days disabled)
    const [availability, setAvailability] = useState<WeeklyAvailability>(() => {
        const initial: WeeklyAvailability = {};
        for (let i = 0; i < 7; i++) {
            initial[i] = { enabled: false, ranges: [] };
        }
        return initial;
    });

    useEffect(() => {
        fetchAvailability();
    }, [nutritionistId]);

    const fetchAvailability = async () => {
        try {
            const res = await fetch(`/api/availability?nutritionistId=${nutritionistId}`);
            if (res.ok) {
                const data = await res.json();

                // Convert flat array to weekly structure
                const weekly: WeeklyAvailability = {};
                for (let i = 0; i < 7; i++) {
                    weekly[i] = { enabled: false, ranges: [] };
                }

                // Group by day of week
                data.forEach((slot: any) => {
                    if (!weekly[slot.dayOfWeek].enabled) {
                        weekly[slot.dayOfWeek] = { enabled: true, ranges: [] };
                    }
                    weekly[slot.dayOfWeek].ranges.push({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    });
                });

                // Set slot duration from first slot if available
                if (data.length > 0) {
                    setSlotDuration(data[0].slotDuration);
                }

                setAvailability(weekly);
            }
        } catch (error) {
            console.error("Error fetching availability:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDay = (dayIndex: number) => {
        setAvailability((prev) => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                enabled: !prev[dayIndex].enabled,
                ranges: !prev[dayIndex].enabled && prev[dayIndex].ranges.length === 0
                    ? [{ startTime: "09:00", endTime: "17:00" }]
                    : prev[dayIndex].ranges,
            },
        }));
    };

    const addTimeRange = (dayIndex: number) => {
        setAvailability((prev) => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                ranges: [...prev[dayIndex].ranges, { startTime: "09:00", endTime: "17:00" }],
            },
        }));
    };

    const removeTimeRange = (dayIndex: number, rangeIndex: number) => {
        setAvailability((prev) => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                ranges: prev[dayIndex].ranges.filter((_, i) => i !== rangeIndex),
            },
        }));
    };

    const updateTimeRange = (
        dayIndex: number,
        rangeIndex: number,
        field: "startTime" | "endTime",
        value: string
    ) => {
        setAvailability((prev) => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                ranges: prev[dayIndex].ranges.map((range, i) =>
                    i === rangeIndex ? { ...range, [field]: value } : range
                ),
            },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Convert weekly structure to flat array
            const slots: any[] = [];
            Object.entries(availability).forEach(([dayIndex, dayData]) => {
                if (dayData.enabled && dayData.ranges.length > 0) {
                    dayData.ranges.forEach((range) => {
                        slots.push({
                            nutritionistId,
                            dayOfWeek: parseInt(dayIndex),
                            startTime: range.startTime,
                            endTime: range.endTime,
                            slotDuration,
                        });
                    });
                }
            });

            const res = await fetch("/api/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nutritionistId, slots }),
            });

            if (res.ok) {
                toast({
                    title: t("settings.success"),
                    description: "Availability saved successfully",
                });
                fetchAvailability();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Error saving availability:", error);
            toast({
                variant: "destructive",
                title: t("settings.error"),
                description: "Failed to save availability",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div>{t("general.loading")}</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t("availability.weeklyHours")}</CardTitle>
                    <CardDescription>
                        {t("availability.weeklyHoursDesc")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Slot Duration */}
                    <div className="flex items-center justify-between pb-4 border-b">
                        <div className="space-y-0.5">
                            <Label>{t("availability.appointmentDuration")}</Label>
                            <p className="text-sm text-muted-foreground">
                                {t("availability.appointmentDurationDesc")}
                            </p>
                        </div>
                        <Select
                            value={slotDuration.toString()}
                            onValueChange={(value) => setSlotDuration(parseInt(value))}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {durationOptions.map((duration) => (
                                    <SelectItem key={duration.value} value={duration.value.toString()}>
                                        {duration.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Days of Week */}
                    <div className="space-y-4">
                        {daysOfWeek.map((day) => (
                            <div key={day.value} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={availability[day.value].enabled}
                                            onCheckedChange={() => toggleDay(day.value)}
                                        />
                                        <Label className="text-base font-medium cursor-pointer"
                                            onClick={() => toggleDay(day.value)}>
                                            {day.label}
                                        </Label>
                                    </div>
                                    {availability[day.value].enabled && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addTimeRange(day.value)}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            {t("availability.addHours")}
                                        </Button>
                                    )}
                                </div>

                                {availability[day.value].enabled && (
                                    <div className="ml-11 space-y-2">
                                        {availability[day.value].ranges.map((range, rangeIndex) => (
                                            <div key={rangeIndex} className="flex items-center gap-2">
                                                <Select
                                                    value={range.startTime}
                                                    onValueChange={(value) =>
                                                        updateTimeRange(day.value, rangeIndex, "startTime", value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {timeOptions.map((time) => (
                                                            <SelectItem key={time} value={time}>
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <span className="text-muted-foreground">-</span>

                                                <Select
                                                    value={range.endTime}
                                                    onValueChange={(value) =>
                                                        updateTimeRange(day.value, rangeIndex, "endTime", value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {timeOptions.map((time) => (
                                                            <SelectItem key={time} value={time}>
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {availability[day.value].ranges.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeTimeRange(day.value, rangeIndex)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? t("general.saving") : t("general.save")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
