"use client";

import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import { BmiGauge } from "@/components/bmi-gauge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z.string().min(1, "Required"),
  photoUrl: z.string().url().or(z.string().length(0)).optional(),
});

const patientSchema = z.object({
  dateOfBirth: z.string().optional(),
  heightCm: z.coerce.number().positive().optional(),
  currentWeightKg: z.coerce.number().positive().optional(),
  goalWeightKg: z.coerce.number().positive().optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  dietaryPreferences: z
    .enum(["omnivore", "vegetarian", "vegan", "pescetarian"])
    .optional(),
  healthConditions: z.string().optional(),
  bodyMeasurements: z
    .object({
      waist: z.coerce.number().positive().optional(),
      hips: z.coerce.number().positive().optional(),
      chest: z.coerce.number().positive().optional(),
    })
    .optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Min 6 chars"),
    newPassword: z.string().min(6, "Min 6 chars"),
    confirmPassword: z.string().min(6, "Min 6 chars"),
  })
  .refine((vals) => vals.newPassword === vals.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const {
    profile: userProfile,
    isLoading: isProfileLoading,
    mutate: mutateProfile,
  } = useUserProfile((user as any)?.id);
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isAvatarDialogOpen, setAvatarDialogOpen] = React.useState(
    false as boolean
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
      profileForm.reset({
        displayName: userProfile.displayName || "",
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
                        <AvatarImage src={userProfile.photoUrl || ""} />
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
              onCropped={(url) => {
                profileForm.setValue("photoUrl", url, { shouldDirty: true });
                // auto-save after upload
                handleProfileSubmit({
                  displayName: profileForm.getValues("displayName"),
                  photoUrl: url,
                });
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.dateOfBirth")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
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
