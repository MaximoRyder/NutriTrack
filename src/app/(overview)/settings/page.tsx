"use client";

import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import { BmiGauge } from "@/components/bmi-gauge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const {
    profile: userProfile,
    isLoading: isProfileLoading,
    mutate: mutateProfile,
  } = useUserProfile((user as any)?.id);
  const { t, locale } = useTranslation();
  const { toast } = useToast();

  const [isAvatarDialogOpen, setAvatarDialogOpen] = React.useState(
    false as boolean
  );

  const profileSchema = useMemo(
    () =>
      z.object({
        displayName: z.string().min(1, t("validation.required")),
        photoUrl: z.string().optional(),
      }),
    [t]
  );

  const patientSchema = useMemo(
    () =>
      z.object({
        dateOfBirth: z.string().optional(),
        heightCm: z.coerce
          .number()
          .positive(t("validation.positiveNumber"))
          .optional(),
        currentWeightKg: z.coerce
          .number()
          .positive(t("validation.positiveNumber"))
          .optional(),
        goalWeightKg: z.coerce
          .number()
          .positive(t("validation.positiveNumber"))
          .optional(),
        activityLevel: z
          .enum(["sedentary", "light", "moderate", "active", "very_active"])
          .optional(),
        dietaryPreferences: z
          .enum(["omnivore", "vegetarian", "vegan", "pescetarian"])
          .optional(),
        healthConditions: z.string().optional(),
        bodyMeasurements: z
          .object({
            waist: z.coerce
              .number()
              .positive(t("validation.positiveNumber"))
              .optional(),
            hips: z.coerce
              .number()
              .positive(t("validation.positiveNumber"))
              .optional(),
            chest: z.coerce
              .number()
              .positive(t("validation.positiveNumber"))
              .optional(),
          })
          .optional(),
      }),
    [t]
  );

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(6, t("validation.passwordMin")),
          newPassword: z.string().min(6, t("validation.passwordMin")),
          confirmPassword: z.string().min(6, t("validation.passwordMin")),
        })
        .refine((vals) => vals.newPassword === vals.confirmPassword, {
          message: t("validation.passwordsMatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      photoUrl: "",
    },
  });
  const patientForm = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      dateOfBirth: "",
      heightCm: undefined,
      currentWeightKg: undefined,
      goalWeightKg: undefined,
      activityLevel: undefined,
      dietaryPreferences: undefined,
      healthConditions: "",
      bodyMeasurements: {
        waist: undefined,
        hips: undefined,
        chest: undefined,
      },
    },
  });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      // Preserve dirty fields (like displayName if the user is editing it)
      const currentDisplayName = profileForm.getValues("displayName");
      const isDisplayNameDirty = profileForm.getFieldState("displayName").isDirty;

      profileForm.reset({
        displayName: isDisplayNameDirty ? currentDisplayName : userProfile.displayName || "",
        photoUrl: userProfile.photoUrl || "",
      });

      if (userProfile.role === "patient") {
        patientForm.reset({
          dateOfBirth: userProfile.dateOfBirth
            ? new Date(userProfile.dateOfBirth).toISOString().slice(0, 10)
            : "",
          heightCm: userProfile.heightCm,
          currentWeightKg: userProfile.currentWeightKg,
          goalWeightKg: userProfile.goalWeightKg,
          activityLevel: userProfile.activityLevel,
          dietaryPreferences: userProfile.dietaryPreferences,
          healthConditions: userProfile.healthConditions || "",
          bodyMeasurements: userProfile.bodyMeasurements || {
            waist: undefined,
            hips: undefined,
            chest: undefined,
          },
        });
      }
    }
  }, [userProfile, profileForm, patientForm]);

  const calculatedBMI = useMemo(() => {
    if (userProfile?.currentWeightKg && userProfile?.heightCm) {
      const h = userProfile.heightCm / 100;
      return (userProfile.currentWeightKg / (h * h)).toFixed(1);
    }
    return null;
  }, [userProfile]);

  const handleProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!userProfile) return;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userProfile.id,
        displayName: values.displayName,
        photoUrl: values.photoUrl,
      }),
    });
    if (res.ok) {
      mutateProfile();
      toast({
        title: t("settings.success"),
        description: t("settings.profileUpdated"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: await res.text(),
      });
    }
  };

  const handlePatientSubmit = async (values: z.infer<typeof patientSchema>) => {
    if (!userProfile) return;
    const payload: any = { id: userProfile.id };
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== "") (payload as any)[k] = v;
    });
    // bodyMeasurements nested
    if (values.bodyMeasurements)
      payload.bodyMeasurements = values.bodyMeasurements;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      mutateProfile();
      toast({
        title: t("settings.success"),
        description: t("settings.personalDataUpdated"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: await res.text(),
      });
    }
  };

  const handlePasswordSubmit = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    if (!userProfile) return;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userProfile.id,
        currentPassword: values.currentPassword,
        password: values.newPassword,
      }),
    });
    if (res.ok) {
      passwordForm.reset();
      toast({
        title: t("settings.success"),
        description: t("settings.passwordUpdated"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: await res.text(),
      });
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("settings.title")}
        </h2>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !userProfile ? (
        <p className="text-sm text-muted-foreground">
          {t("general.loadingError")}
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.profile")}</CardTitle>
                <CardDescription>{t("settings.profileDesc")}</CardDescription>
              </CardHeader>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-0"
                >
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={profileForm.watch("photoUrl") || ""}
                        />
                        <AvatarFallback>
                          {userProfile.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAvatarDialogOpen(true)}
                        >
                          {t("settings.uploadPhoto")}
                        </Button>
                        <FormField
                          control={profileForm.control}
                          name="photoUrl"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input type="hidden" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.displayName")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <Label>{t("settings.email")}</Label>
                      <Input value={userProfile.email} readOnly disabled />
                    </div>
                    {userProfile.role === "nutritionist" && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>
                          {t("settings.invitationCode", {
                            code: userProfile.invitationCode || t("general.na"),
                          })}
                        </span>
                        {userProfile.invitationCode && (
                          <Badge variant="secondary">
                            {userProfile.invitationCode}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                    >
                      {t("settings.save")}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            <AvatarCropDialog
              isOpen={isAvatarDialogOpen}
              onOpenChange={setAvatarDialogOpen}
              onCropped={async (url) => {
                // Immediate save for profile picture
                if (!userProfile) return;

                // Optimistic update
                profileForm.setValue("photoUrl", url, { shouldDirty: false });

                const res = await fetch("/api/users", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: userProfile.id,
                    photoUrl: url,
                  }),
                });

                if (res.ok) {
                  mutateProfile();
                  toast({
                    title: t("settings.success"),
                    description: t("settings.profileUpdated"),
                  });
                } else {
                  toast({
                    variant: "destructive",
                    title: t("settings.error"),
                    description: await res.text(),
                  });
                }
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.security")}</CardTitle>
                <CardDescription>{t("settings.securityDesc")}</CardDescription>
              </CardHeader>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                >
                  <CardContent className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.currentPassword")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.newPassword")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.confirmPassword")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      {t("settings.updatePassword")}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            {userProfile.role === "patient" && calculatedBMI && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.calculatedBmi")}</CardTitle>
                  <CardDescription>{t("settings.bmiDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{calculatedBMI}</div>
                  <div className="mt-4">
                    {/* BMI Gauge */}
                    {/* Dynamically imported component to avoid SSR translation mismatch */}
                    {/* @ts-expect-error client component */}
                    <BmiGauge bmi={Number(calculatedBMI)} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {userProfile.role === "patient" && (
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

                        // Update displayMonth when popover opens to show the selected date
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
                                value={
                                  field.value === undefined ? "" : field.value
                                }
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
                                value={
                                  field.value === undefined ? "" : field.value
                                }
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
                              value={
                                field.value === undefined ? "" : field.value
                              }
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
                                  value={
                                    field.value === undefined ? "" : field.value
                                  }
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
                                  value={
                                    field.value === undefined ? "" : field.value
                                  }
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
                                  value={
                                    field.value === undefined ? "" : field.value
                                  }
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
                                  placeholder={t(
                                    "settings.selectActivityLevel"
                                  )}
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
                                  placeholder={t(
                                    "settings.selectDietaryPreferences"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="omnivore">
                                {t(
                                  "settings.dietaryPreferencesOptions.omnivore"
                                )}
                              </SelectItem>
                              <SelectItem value="vegetarian">
                                {t(
                                  "settings.dietaryPreferencesOptions.vegetarian"
                                )}
                              </SelectItem>
                              <SelectItem value="vegan">
                                {t("settings.dietaryPreferencesOptions.vegan")}
                              </SelectItem>
                              <SelectItem value="pescetarian">
                                {t(
                                  "settings.dietaryPreferencesOptions.pescetarian"
                                )}
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
                              placeholder={t(
                                "settings.healthConditionsPlaceholder"
                              )}
                              {...field}
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
          )}
        </div>
      )}
    </div>
  );
}
