"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { WeekPlanBuilder } from "@/components/week-plan-builder";
import type { MealItem, MealPlanTemplate } from "@/lib/types";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const EMPTY_WEEK_STRUCTURE = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

export default function MealPlanTemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([]);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<MealPlanTemplate | null>(
    null
  );
  const [templateToDelete, setTemplateToDelete] =
    useState<MealPlanTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekStructure, setWeekStructure] = useState(EMPTY_WEEK_STRUCTURE);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/meal-plan-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchMealItems = async () => {
    try {
      const response = await fetch("/api/meal-items");
      if (response.ok) {
        const data = await response.json();
        setMealItems(data);
      }
    } catch (error) {
      console.error("Error fetching meal items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTemplates();
      fetchMealItems();
    }
  }, [session]);

  const handleOpenDialog = (template?: MealPlanTemplate) => {
    if (template) {
      setTemplateToEdit(template);
      setName(template.name);
      setDescription(template.description || "");
      setWeekStructure(template.weekStructure);
    } else {
      setTemplateToEdit(null);
      setName("");
      setDescription("");
      setWeekStructure(EMPTY_WEEK_STRUCTURE);
    }
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!name.trim()) {
      alert("El nombre es requerido");
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        name,
        description,
        weekStructure,
      };

      if (templateToEdit) {
        // Update
        const response = await fetch(
          `/api/meal-plan-templates?id=${templateToEdit.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateData),
          }
        );

        if (response.ok) {
          await fetchTemplates();
          setIsDialogOpen(false);
        }
      } else {
        // Create
        const response = await fetch("/api/meal-plan-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData),
        });

        if (response.ok) {
          await fetchTemplates();
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(
        `/api/meal-plan-templates?id=${templateToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchTemplates();
        setTemplateToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const getTotalMeals = (template: MealPlanTemplate) => {
    return Object.values(template.weekStructure).reduce(
      (total, day) => total + day.length,
      0
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Planes</h1>
          <p className="text-muted-foreground">
            Crea planes semanales reutilizables
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Plantilla
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando plantillas...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tienes plantillas creadas. ¡Crea tu primera plantilla!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {getTotalMeals(template)} comidas programadas
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplateToDelete(template)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] grid-rows-[auto,1fr,auto] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {templateToEdit ? "Editar Plantilla" : "Crear Nueva Plantilla"}
            </DialogTitle>
            <DialogDescription>
              {templateToEdit
                ? "Modifica tu plantilla de plan semanal"
                : "Crea un plan semanal reutilizable"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-full px-6">
            <div className="space-y-4 pb-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Plan Detox Semana 1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el objetivo de este plan..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Plan Semanal</Label>
                <div className="mt-2">
                  <WeekPlanBuilder
                    mealItems={mealItems}
                    weekStructure={weekStructure}
                    onChange={setWeekStructure}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : templateToEdit
                ? "Guardar Cambios"
                : "Crear Plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{templateToDelete?.name}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
