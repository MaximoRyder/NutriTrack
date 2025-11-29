"use client";

import { ImageUpload } from "@/components/image-upload";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { Meal } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ScrollArea } from "./ui/scroll-area";

interface AddMealDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddMeal: (
    mealData: Omit<Meal, "id" | "timestamp" | "userId"> & { mealTime?: string }
  ) => void;
  mealToEdit?: Meal | null;
  isLoading?: boolean;
}

const MAX_NAME_LENGTH = 50;
const MAX_DESC_LENGTH = 300;

export function AddMealDialog({
  isOpen,
  onOpenChange,
  onAddMeal,
  mealToEdit,
  isLoading = false,
}: AddMealDialogProps) {
  const { t } = useTranslation();

  const isEditing = !!mealToEdit;

  const formSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t("addMeal.validation.nameRequired"))
          .max(MAX_NAME_LENGTH, t("addMeal.validation.nameTooLong")),
        description: z
          .string()
          .max(MAX_DESC_LENGTH, t("addMeal.validation.descriptionTooLong"))
          .optional(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
        portionSize: z.enum(["small", "medium", "large", "half"]).optional(),
        photoUrl: z.string().min(1, t("addMeal.validation.photoRequired")),
        mealTime: z.string().optional(), // HH:mm format
      }),
    [t]
  );

  type AddMealFormValues = z.infer<typeof formSchema>;

  const form = useForm<AddMealFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      mealType: "breakfast",
      photoUrl: "",
      portionSize: undefined,
      mealTime: "",
    },
  });

  const nameValue = form.watch("name");
  const descriptionValue = form.watch("description");

  useEffect(() => {
    // We need to re-validate when the language changes
    form.trigger();
  }, [t, form]);

  useEffect(() => {
    if (isOpen) {
      if (mealToEdit) {
        // Pre-fill form for editing
        form.reset({
          name: mealToEdit.name,
          description: mealToEdit.description || "",
          mealType: mealToEdit.mealType,
          portionSize: mealToEdit.portionSize,
          photoUrl: mealToEdit.photoUrl,
          mealTime: mealToEdit.timestamp
            ? format(new Date(mealToEdit.timestamp), "HH:mm")
            : format(new Date(), "HH:mm"),
        });
      } else {
        // Reset form for adding new meal
        form.reset({
          name: "",
          description: "",
          mealType: "breakfast",
          photoUrl: "",
          portionSize: undefined,
          mealTime: format(new Date(), "HH:mm"),
        });
      }
    }
  }, [isOpen, mealToEdit, form]);



  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  const onSubmit = (values: AddMealFormValues) => {
    onAddMeal(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isEditing ? t("addMeal.editTitle") : t("addMeal.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("addMeal.editDescription")
              : t("addMeal.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-rows-[1fr,auto] h-full overflow-hidden"
          >
            <ScrollArea className="h-full">
              <div className="space-y-4 px-6 pb-4">
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("addMeal.photo")}</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("addMeal.name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("addMeal.namePlaceholder")}
                          {...field}
                          maxLength={MAX_NAME_LENGTH}
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <div className="text-xs text-muted-foreground">
                          {t("addMeal.charCounter")
                            .replace(
                              "{current}",
                              (nameValue || "").length.toString()
                            )
                            .replace("{max}", MAX_NAME_LENGTH.toString())}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("addMeal.type")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("addMeal.selectType")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">
                              {t("addMeal.breakfast")}
                            </SelectItem>
                            <SelectItem value="lunch">
                              {t("addMeal.lunch")}
                            </SelectItem>
                            <SelectItem value="dinner">
                              {t("addMeal.dinner")}
                            </SelectItem>
                            <SelectItem value="snack">
                              {t("addMeal.snack")}
                            </SelectItem>
                            <SelectItem value="other">
                              {t("addMeal.other")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("addMeal.time")}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("addMeal.descriptionField")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("addMeal.descriptionPlaceholder")}
                          {...field}
                          maxLength={MAX_DESC_LENGTH}
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <div className="text-xs text-muted-foreground ml-auto">
                          {t("addMeal.charCounter")
                            .replace(
                              "{current}",
                              (descriptionValue || "").length.toString()
                            )
                            .replace("{max}", MAX_DESC_LENGTH.toString())}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portionSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("addMeal.portionSize")}</FormLabel>
                      <Select
                        onValueChange={(val) =>
                          field.onChange(val === "" ? undefined : val)
                        }
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("addMeal.selectPortion")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">
                            {t("addMeal.small")}
                          </SelectItem>
                          <SelectItem value="medium">
                            {t("addMeal.medium")}
                          </SelectItem>
                          <SelectItem value="large">
                            {t("addMeal.large")}
                          </SelectItem>
                          <SelectItem value="half">
                            {t("addMeal.half")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("addMeal.saving")
                  : isEditing
                    ? t("addMeal.saveChanges")
                    : t("addMeal.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
