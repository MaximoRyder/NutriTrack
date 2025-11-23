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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { MealItem } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ScrollArea } from "./ui/scroll-area";

interface CreateMealItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (mealItemData: Partial<MealItem>) => Promise<void>;
  mealItemToEdit?: MealItem | null;
}

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 1000;

export function CreateMealItemDialog({
  isOpen,
  onOpenChange,
  onSave,
  mealItemToEdit,
}: CreateMealItemDialogProps) {
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!mealItemToEdit;

  const formSchema = z.object({
    title: z
      .string()
      .min(1, "El título es requerido")
      .max(MAX_TITLE_LENGTH, `Máximo ${MAX_TITLE_LENGTH} caracteres`),
    description: z
      .string()
      .min(1, "La descripción es requerida")
      .max(MAX_DESC_LENGTH, `Máximo ${MAX_DESC_LENGTH} caracteres`),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
    photoUrl: z.string().optional(),
    videoUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    portionInfo: z.string().optional(),
    recommendedTime: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      mealType: "breakfast",
      photoUrl: "",
      videoUrl: "",
      portionInfo: "",
      recommendedTime: "",
    },
  });

  const titleValue = form.watch("title");
  const descriptionValue = form.watch("description");

  useEffect(() => {
    if (isOpen) {
      if (mealItemToEdit) {
        form.reset({
          title: mealItemToEdit.title,
          description: mealItemToEdit.description,
          mealType: mealItemToEdit.mealType,
          photoUrl: mealItemToEdit.photoUrl || "",
          videoUrl: mealItemToEdit.videoUrl || "",
          portionInfo: mealItemToEdit.portionInfo || "",
          recommendedTime: mealItemToEdit.recommendedTime || "",
        });
        setImagePreview(mealItemToEdit.photoUrl || null);
      } else {
        form.reset({
          title: "",
          description: "",
          mealType: "breakfast",
          photoUrl: "",
          videoUrl: "",
          portionInfo: "",
          recommendedTime: "",
        });
        setImagePreview(null);
      }
    }
  }, [isOpen, mealItemToEdit, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        form.setValue("photoUrl", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving meal item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isEditing ? "Editar Comida" : "Crear Nueva Comida"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles de la comida"
              : "Agrega una nueva comida a tu biblioteca"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-rows-[1fr,auto] h-full overflow-hidden"
          >
            <ScrollArea className="h-full">
              <div className="space-y-4 px-6 pb-4">
                {/* Photo Upload */}
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Foto (Opcional)</FormLabel>
                      <FormControl>
                        <div
                          className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-secondary/50 p-6 text-center transition-colors hover:border-primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {imagePreview ? (
                            <Image
                              src={imagePreview}
                              alt="Meal preview"
                              width={400}
                              height={300}
                              className="h-auto w-full max-h-48 rounded-md object-cover"
                            />
                          ) : (
                            <div className="space-y-2 text-muted-foreground">
                              <UploadCloud className="mx-auto h-10 w-10" />
                              <p className="text-sm">
                                Click para subir una foto
                              </p>
                            </div>
                          )}
                          <Input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Ensalada César con Pollo"
                          {...field}
                          maxLength={MAX_TITLE_LENGTH}
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <div className="text-xs text-muted-foreground">
                          {(titleValue || "").length}/{MAX_TITLE_LENGTH}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Meal Type and Recommended Time */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Comida *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">Desayuno</SelectItem>
                            <SelectItem value="lunch">Almuerzo</SelectItem>
                            <SelectItem value="dinner">Cena</SelectItem>
                            <SelectItem value="snack">Merienda</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recommendedTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horario Recomendado</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receta/Descripción *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe la receta, ingredientes, preparación..."
                          {...field}
                          maxLength={MAX_DESC_LENGTH}
                          rows={6}
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <div className="text-xs text-muted-foreground ml-auto">
                          {(descriptionValue || "").length}/{MAX_DESC_LENGTH}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Portion Info */}
                <FormField
                  control={form.control}
                  name="portionInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porciones/Cantidades</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 1 taza, 150g, 2 porciones"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Video URL */}
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Video (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Guardando..."
                  : isEditing
                  ? "Guardar Cambios"
                  : "Crear Comida"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
