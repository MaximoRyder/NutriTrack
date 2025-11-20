"use client";

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
import { useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
import * as z from "zod";

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required."),
  email: z.string().email(),
  role: z.enum(["patient", "nutritionist", "admin"]),
  subscriptionStatus: z
    .enum(["active", "inactive", "trial", "pending"])
    .optional(),
  invitationCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  heightCm: z.coerce.number().positive().optional().or(z.literal("")),
  currentWeightKg: z.coerce.number().positive().optional().or(z.literal("")),
  goalWeightKg: z.coerce.number().positive().optional().or(z.literal("")),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  dietaryPreferences: z
    .enum(["omnivore", "vegetarian", "vegan", "pescetarian"])
    .optional(),
  healthConditions: z.string().optional(),
  bodyMeasurements: z
    .object({
      waist: z.coerce.number().positive().optional().or(z.literal("")),
      hips: z.coerce.number().positive().optional().or(z.literal("")),
      chest: z.coerce.number().positive().optional().or(z.literal("")),
    })
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  const { profile: userProfile, isLoading: isProfileLoading } =
    useUserProfile(userId);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    // Provide controlled default values to avoid uncontrolled -> controlled warnings
    defaultValues: {
      displayName: "",
      email: "",
      role: undefined as any, // allow reset to populate actual role
      subscriptionStatus: undefined,
      invitationCode: "",
      dateOfBirth: "",
      heightCm: "" as any,
      currentWeightKg: "" as any,
      goalWeightKg: "" as any,
      activityLevel: undefined,
      dietaryPreferences: undefined,
      healthConditions: "",
      bodyMeasurements: { chest: "" as any, waist: "" as any, hips: "" as any },
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        subscriptionStatus: userProfile.subscriptionStatus,
        invitationCode: userProfile.invitationCode,
        dateOfBirth: userProfile.dateOfBirth,
        heightCm: userProfile.heightCm || ("" as any),
        currentWeightKg: userProfile.currentWeightKg || ("" as any),
        goalWeightKg: userProfile.goalWeightKg || ("" as any),
        activityLevel: userProfile.activityLevel,
        dietaryPreferences: userProfile.dietaryPreferences,
        healthConditions: userProfile.healthConditions,
        bodyMeasurements: userProfile.bodyMeasurements,
      });
      // Force set individual values to ensure components depending on defaultValue remount with correct state
      form.setValue("role", userProfile.role as any, { shouldDirty: false });
      if (userProfile.role === "nutritionist") {
        form.setValue(
          "subscriptionStatus",
          userProfile.subscriptionStatus as any,
          { shouldDirty: false }
        );
      }
    }
  }, [userProfile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...values }),
      });

      if (!response.ok) throw new Error("Error al actualizar usuario");

      mutate("/api/users");
      mutate(`/api/users?id=${userId}`);

      toast({
        title: t("admin.userUpdated"),
        description: `${t("admin.userUpdatedDesc")} (${values.email})`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  if (isProfileLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>{t("patientDetail.notFound")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("admin.editUser")}
        </h2>
        <p className="text-muted-foreground">
          {userProfile.displayName} ({userProfile.email})
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.profileInfo")}</CardTitle>
              <CardDescription>{t("admin.profileInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.displayName")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.email")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.table.role")}</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange(v === "" ? undefined : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin.selectRole")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patient">
                          {t("roles.patient")}
                        </SelectItem>
                        <SelectItem value="nutritionist">
                          {t("roles.nutritionist")}
                        </SelectItem>
                        <SelectItem value="admin">
                          {t("roles.admin")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("role") === "nutritionist" && (
                <>
                  <FormField
                    control={form.control}
                    name="subscriptionStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.table.status")}</FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(v === "" ? undefined : v)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("admin.selectStatus")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">
                              {t("admin.status.active")}
                            </SelectItem>
                            <SelectItem value="inactive">
                              {t("admin.status.inactive")}
                            </SelectItem>
                            <SelectItem value="pending">
                              {t("admin.status.pending")}
                            </SelectItem>
                            <SelectItem value="trial">
                              {t("admin.status.trial")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invitationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.invitationCodeLabel")}
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input {...field} value={field.value || ""} />
                            {field.value && (
                              <Badge variant="secondary">{field.value}</Badge>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
          {form.watch("role") === "patient" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t("settings.personalData")}</CardTitle>
                <CardDescription>{t("admin.personalDataDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.dateOfBirth")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="heightCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.height")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="170"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentWeightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.currentWeight")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="75"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goalWeightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.goalWeight")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="68"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {t("settings.bodyMeasurements")}
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
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
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
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
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
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
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dietaryPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.dietaryPreferences")}</FormLabel>
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
                            {t("settings.dietaryPreferencesOptions.omnivore")}
                          </SelectItem>
                          <SelectItem value="vegetarian">
                            {t("settings.dietaryPreferencesOptions.vegetarian")}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="healthConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.healthConditions")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "settings.healthConditionsPlaceholder"
                          )}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <CardFooter className="mt-6 border-t px-6 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("settings.save")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
