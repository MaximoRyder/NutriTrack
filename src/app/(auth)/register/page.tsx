"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  displayName: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["patient", "nutritionist"], {
    required_error: "You must select a role.",
  }),
  invitationCode: z.string().optional(),
});

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      role: "patient",
    },
  });

  const selectedRole = form.watch("role");

  useEffect(() => {
    // If user is already logged in and not processing registration, redirect
    if (!isUserLoading && user && !isProcessing) {
      router.push("/overview");
    }
  }, [user, isUserLoading, isProcessing, router]);

  if (isUserLoading || (user && !isProcessing)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t("general.loading")}</p>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessing(true);
    try {
      // Register via API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          displayName: values.displayName,
          role: values.role,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        toast({
          variant: "destructive",
          title: t("welcome.genericErrorTitle"),
          description: txt || t("welcome.genericError"),
        });
        setIsProcessing(false);
        return;
      }
      // Auto sign in
      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (signInRes?.error) {
        toast({
          variant: "destructive",
          title: t("welcome.genericErrorTitle"),
          description: signInRes.error,
        });
        setIsProcessing(false);
        return;
      }
      // Redirect based on role
      if (
        values.role === "patient" &&
        values.email.toLowerCase() !== "admin@nutritrack.pro"
      ) {
        router.push("/welcome");
      } else {
        router.push("/overview");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("welcome.genericErrorTitle"),
        description: error?.message || t("welcome.genericError"),
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {t("register.title")}
        </CardTitle>
        <CardDescription>{t("register.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t("register.role")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="patient" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("register.rolePatient")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="nutritionist" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("register.roleNutritionist")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        selectedRole === "patient"
                          ? t("register.namePlaceholder")
                          : t("register.namePlaceholderNutritionist")
                      }
                      {...field}
                    />
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
                  <FormLabel>{t("register.email")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        selectedRole === "patient"
                          ? "patient@example.com"
                          : "nutritionist@example.com"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? t("welcome.saving") : t("register.submit")}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t("register.hasAccount")}{" "}
          <Link href="/login" className="underline">
            {t("register.login")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
