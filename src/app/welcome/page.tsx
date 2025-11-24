"use client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ruler, Sparkles, Target, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  invitationCode: z.string().optional(),
  goalWeightKg: z.coerce
    .number({ invalid_type_error: "" })
    .positive("Goal weight must be positive")
    .optional(),
  heightCm: z.coerce
    .number({ invalid_type_error: "" })
    .positive("Height must be positive")
    .optional(),
});

export default function WelcomePage() {
  const { t } = useTranslation();
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(
    (user as any)?.id || null
  );
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only redirect if user has COMPLETE data (not just a role)
  useEffect(() => {
    if (
      profile &&
      profile.role === "patient" &&
      (profile.heightCm || 0) > 0 &&
      (profile.goalWeightKg || 0) > 0
    ) {
      router.replace("/overview");
    }
  }, [profile, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invitationCode: "",
      goalWeightKg: undefined,
      heightCm: undefined,
    },
  });

  const handleSkip = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Just set role to patient and redirect
      const patchRes = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: (user as any).id,
          role: "patient",
        }),
      });
      if (!patchRes.ok) {
        throw new Error(await patchRes.text());
      }
      router.replace("/overview");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("welcome.genericErrorTitle"),
        description: t("welcome.genericError"),
      });
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // First, update user basic metrics (set role to patient explicitly)
      const patchRes = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: (user as any).id,
          role: "patient",
          goalWeightKg: values.goalWeightKg,
          heightCm: values.heightCm,
        }),
      });
      if (!patchRes.ok) {
        throw new Error(await patchRes.text());
      }

      // If invitation code provided, attempt assignment
      if (values.invitationCode) {
        const assignRes = await fetch("/api/users/assign-by-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationCode: values.invitationCode }),
        });
        if (!assignRes.ok) {
          if (assignRes.status === 404) {
            toast({
              variant: "destructive",
              title: t("welcome.errorTitle"),
              description: t("welcome.errorMessage"),
            });
            setIsSubmitting(false);
            return;
          } else {
            throw new Error(await assignRes.text());
          }
        }
      }

      router.replace("/overview");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("welcome.genericErrorTitle"),
        description: t("welcome.genericError"),
      });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p>{t("general.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute top-4 left-4">
        <Logo textClassName="text-foreground" />
      </div>

      <div className="w-full max-w-2xl">
        {/* Welcome Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("welcome.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("welcome.subtitle")}
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardDescription className="text-base">
              {t("welcome.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Invitation Code */}
                <FormField
                  control={form.control}
                  name="invitationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        {t("welcome.invitationCode")}
                        <span className="text-muted-foreground text-xs font-normal">
                          ({t("welcome.optional")})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("welcome.invitationCodePlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          className="text-base"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {t("welcome.invitationCodeHelper")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Goal Weight and Height in a grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="goalWeightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          {t("welcome.goalWeight")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="65"
                            {...field}
                            value={field.value ?? ""}
                            className="text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heightCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-primary" />
                          {t("welcome.height")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="170"
                            {...field}
                            value={field.value ?? ""}
                            className="text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("welcome.saving") : t("welcome.submit")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                  >
                    {t("welcome.skipForNow")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
