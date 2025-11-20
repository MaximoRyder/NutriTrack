"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPatientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPatientAdded: () => void;
}

export function AddPatientDialog({
  isOpen,
  onOpenChange,
  onPatientAdded,
}: AddPatientDialogProps) {
  const { t } = useTranslation();
  const { user: nutritionist } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  const onSubmit = async (values: FormValues) => {
    if (!nutritionist) return;

    setIsSubmitting(true);

    try {
      // Call API to assign patient by email
      const res = await fetch("/api/users/assign-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientEmail: values.email.toLowerCase() }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast({
          variant: "destructive",
          title: errorText || t("addPatient.errorGeneric"),
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: t("addPatient.success"),
      });
      onPatientAdded();
      handleOpenChange(false);
    } catch (error) {
      console.error("Error assigning patient:", error);
      toast({
        variant: "destructive",
        title: t("addPatient.errorGeneric"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addPatient.title")}</DialogTitle>
          <DialogDescription>{t("addPatient.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addPatient.email")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("addPatient.emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("addPatient.submitting")
                  : t("addPatient.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
