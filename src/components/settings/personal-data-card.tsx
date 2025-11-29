"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface PersonalDataCardProps {
    patientForm: UseFormReturn<any>;
    handlePatientSubmit: (values: any) => Promise<void>;
}

export function PersonalDataCard({
    patientForm,
    handlePatientSubmit,
}: PersonalDataCardProps) {
    const { t, locale } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.personalData")}</CardTitle>
                <CardDescription>
                    {t("settings.personalDataDesc")}
                </CardDescription>
            </CardHeader>
            <Form {...patientForm}>
                <form onSubmit={patientForm.handleSubmit(handlePatientSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={patientForm.control}
                            name="dateOfBirth"
                            render={({ field }) => {
                                const dateLocales = { en: enUS, es: es, pt: ptBR };
                                const currentLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;
                                const [isOpen, setIsOpen] = React.useState(false);
                                const [displayMonth, setDisplayMonth] = React.useState<Date>(
                                    field.value ? new Date(field.value + 'T00:00:00') : new Date()
                                );

                                React.useEffect(() => {
                                    if (isOpen && field.value) {
                                        setDisplayMonth(new Date(field.value + 'T00:00:00'));
                                    }
                                }, [isOpen, field.value]);

                                return (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="pointer-events-none">{t("settings.dateOfBirth")}</FormLabel>
                                        <Popover open={isOpen} onOpenChange={setIsOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(new Date(field.value + 'T00:00:00'), "PPP", { locale: currentLocale })
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                {t("settings.dateOfBirth")}
                                                            </span>
                                                        )}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                                                    <div className="flex gap-1 sm:gap-2">
                                                        <Select
                                                            value={displayMonth.getMonth().toString()}
                                                            onValueChange={(month) => {
                                                                const newDate = new Date(displayMonth);
                                                                newDate.setMonth(parseInt(month));
                                                                setDisplayMonth(newDate);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-[120px] sm:w-[140px] h-8 sm:h-10 text-xs sm:text-sm capitalize">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" className="max-h-[300px]">
                                                                {Array.from({ length: 12 }, (_, i) => {
                                                                    const date = new Date(2000, i, 1);
                                                                    const monthName = format(date, "MMMM", { locale: currentLocale });
                                                                    return (
                                                                        <SelectItem key={i} value={i.toString()} className="capitalize">
                                                                            {monthName}
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select
                                                            value={displayMonth.getFullYear().toString()}
                                                            onValueChange={(year) => {
                                                                const newDate = new Date(displayMonth);
                                                                newDate.setFullYear(parseInt(year));
                                                                setDisplayMonth(newDate);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-[85px] sm:w-[100px] h-8 sm:h-10 text-xs sm:text-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 125 }, (_, i) => {
                                                                    const year = new Date().getFullYear() - i;
                                                                    return (
                                                                        <SelectItem key={year} value={year.toString()}>
                                                                            {year}
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                const year = date.getFullYear();
                                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                const day = String(date.getDate()).padStart(2, '0');
                                                                field.onChange(`${year}-${month}-${day}`);
                                                                setIsOpen(false);
                                                            }
                                                        }}
                                                        month={displayMonth}
                                                        onMonthChange={setDisplayMonth}
                                                        locale={currentLocale}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                        className="text-base"
                                                        classNames={{
                                                            months: "flex flex-col space-y-4",
                                                            month: "space-y-4",
                                                            caption: "flex justify-center pt-1 relative items-center",
                                                            caption_label: "text-sm sm:text-base font-medium capitalize",
                                                            nav: "space-x-1 flex items-center",
                                                            nav_button: "h-7 w-7 sm:h-9 sm:w-9",
                                                            table: "w-full border-collapse space-y-1",
                                                            head_row: "flex",
                                                            head_cell: "text-muted-foreground rounded-md w-8 sm:w-10 font-normal text-[0.65rem] sm:text-sm capitalize",
                                                            row: "flex w-full mt-1 sm:mt-2",
                                                            cell: "h-8 w-8 sm:h-10 sm:w-10 text-center text-xs sm:text-sm p-0 relative",
                                                            day: "h-8 w-8 sm:h-10 sm:w-10 p-0 font-normal text-xs sm:text-sm",
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={patientForm.control}
                                name="heightCm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.height")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="170"
                                                value={field.value === undefined ? "" : field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ""
                                                            ? undefined
                                                            : Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={patientForm.control}
                                name="currentWeightKg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.currentWeight")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="75"
                                                value={field.value === undefined ? "" : field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ""
                                                            ? undefined
                                                            : Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={patientForm.control}
                            name="goalWeightKg"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("settings.goalWeight")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="68"
                                            value={field.value === undefined ? "" : field.value}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ""
                                                        ? undefined
                                                        : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div>
                            <Label className="mb-2 block">
                                {t("settings.bodyMeasurements")}
                            </Label>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={patientForm.control}
                                    name="bodyMeasurements.chest"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                {t("settings.chest")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="90"
                                                    value={field.value === undefined ? "" : field.value}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === ""
                                                                ? undefined
                                                                : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={patientForm.control}
                                    name="bodyMeasurements.waist"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                {t("settings.waist")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="80"
                                                    value={field.value === undefined ? "" : field.value}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === ""
                                                                ? undefined
                                                                : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={patientForm.control}
                                    name="bodyMeasurements.hips"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                {t("settings.hips")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="95"
                                                    value={field.value === undefined ? "" : field.value}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === ""
                                                                ? undefined
                                                                : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-2 block">
                                {t("settings.bodyComposition")}
                            </Label>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h4 className="font-medium text-sm">{t("settings.bodyFat")}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={patientForm.control}
                                            name="bodyFatPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">
                                                        Current (%)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="20"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={patientForm.control}
                                            name="goalBodyFatPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">
                                                        {t("settings.goalBodyFat").replace(" (%)", "")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="15"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h4 className="font-medium text-sm">{t("settings.visceralFat")}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={patientForm.control}
                                            name="visceralFatPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">
                                                        Current (%)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="10"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={patientForm.control}
                                            name="goalVisceralFatPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">
                                                        {t("settings.goalVisceralFat").replace(" (%)", "")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="8"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h4 className="font-medium text-sm">{t("settings.muscleMass")}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={patientForm.control}
                                            name="muscleMassPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">
                                                        Current (%)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="35"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={patientForm.control}
                                            name="goalMuscleMassPercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">
                                                        {t("settings.goalMuscleMass").replace(" (%)", "")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="40"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <FormField
                            control={patientForm.control}
                            name="activityLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("settings.activityLevel")}</FormLabel>
                                    <Select
                                        value={field.value ?? ""}
                                        onValueChange={(v) =>
                                            field.onChange(v === "" ? undefined : v)
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={t("settings.selectActivityLevel")}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="sedentary">
                                                {t("settings.activityLevels.sedentary")}
                                            </SelectItem>
                                            <SelectItem value="light">
                                                {t("settings.activityLevels.light")}
                                            </SelectItem>
                                            <SelectItem value="moderate">
                                                {t("settings.activityLevels.moderate")}
                                            </SelectItem>
                                            <SelectItem value="active">
                                                {t("settings.activityLevels.active")}
                                            </SelectItem>
                                            <SelectItem value="very_active">
                                                {t("settings.activityLevels.very_active")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={patientForm.control}
                            name="dietaryPreferences"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("settings.dietaryPreferences")}
                                    </FormLabel>
                                    <Select
                                        value={field.value ?? ""}
                                        onValueChange={(v) =>
                                            field.onChange(v === "" ? undefined : v)
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={t("settings.selectDietaryPreferences")}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="omnivore">
                                                {t("settings.dietaryPreferencesOptions.omnivore")}
                                            </SelectItem>
                                            <SelectItem value="vegetarian">
                                                {t("settings.dietaryPreferencesOptions.vegetarian")}
                                            </SelectItem>
                                            <SelectItem value="vegan">
                                                {t("settings.dietaryPreferencesOptions.vegan")}
                                            </SelectItem>
                                            <SelectItem value="pescetarian">
                                                {t("settings.dietaryPreferencesOptions.pescetarian")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={patientForm.control}
                            name="healthConditions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("settings.healthConditions")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("settings.healthConditionsPlaceholder")}
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button
                            type="submit"
                            disabled={patientForm.formState.isSubmitting}
                        >
                            {t("settings.savePersonalData")}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
