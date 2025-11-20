"use client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from "@/hooks/use-toast";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
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

  // If already completed basic metrics, redirect
  useEffect(() => {
    if (
      profile &&
      (profile.heightCm || 0) > 0 &&
      (profile.goalWeightKg || 0) > 0 &&
      profile.role === "patient"
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Logo textClassName="text-foreground" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t("welcome.title")}
          </CardTitle>
          <CardDescription>{t("welcome.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="invitationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("welcome.invitationCode")}{" "}
                      <span className="text-muted-foreground text-xs">
                        (Optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("welcome.invitationCodePlaceholder")}
                        {...field}
                        value={field.value ?? ""}
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
                    <FormLabel>{t("welcome.goalWeight")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="65"
                        {...field}
                        value={field.value ?? ""}
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
                    <FormLabel>{t("welcome.height")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="170"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("welcome.saving") : t("welcome.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
