"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WeekPlanBuilder } from "@/components/week-plan-builder";
import type { MealItem, MealPlanTemplate, UserProfile } from "@/lib/types";
import { useEffect, useState } from "react";

interface AssignMealPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patient: UserProfile;
  onSuccess: () => void;
}

const EMPTY_WEEK_STRUCTURE = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

export function AssignMealPlanDialog({
  isOpen,
  onOpenChange,
  patient,
  onSuccess,
}: AssignMealPlanDialogProps) {
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([]);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [weekStructure, setWeekStructure] = useState(EMPTY_WEEK_STRUCTURE);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      try {
        const [templatesRes, itemsRes] = await Promise.all([
          fetch("/api/meal-plan-templates"),
          fetch("/api/meal-items"),
        ]);

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setMealItems(itemsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setName(template.name);
        setDescription(template.description || "");
        setWeekStructure(template.weekStructure);
      }
    }
  }, [selectedTemplateId, templates]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("El nombre del plan es requerido");
      return;
    }

    if (!startDate) {
      alert("La fecha de inicio es requerida");
      return;
    }

    setIsSaving(true);
    try {
      const planData = {
        patientId: patient.id,
        templateId: useTemplate ? selectedTemplateId : undefined,
        name,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        weekStructure,
        isActive,
      };

      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setUseTemplate(true);
        setSelectedTemplateId("");
        setName("");
        setDescription("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
        setWeekStructure(EMPTY_WEEK_STRUCTURE);
        setIsActive(true);
      } else {
        const error = await response.json();
        alert(error.error || "Error al asignar el plan");
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
      alert("Error al asignar el plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] grid-rows-[auto,1fr,auto] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Asignar Plan de Comidas</DialogTitle>
          <DialogDescription>
            Asignar un plan de comidas a {patient.displayName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full px-6">
          <div className="space-y-6 pb-4">
            <Tabs
              value={useTemplate ? "template" : "custom"}
              onValueChange={(v) => setUseTemplate(v === "template")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">Usar Plantilla</TabsTrigger>
                <TabsTrigger value="custom">Crear Personalizado</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4 mt-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Cargando plantillas...
                  </p>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tienes plantillas creadas. Crea una plantilla primero o
                    usa la opción "Crear Personalizado".
                  </p>
                ) : (
                  <div>
                    <Label htmlFor="template">Seleccionar Plantilla *</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={setSelectedTemplateId}
                    >
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Selecciona una plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Crea un plan personalizado desde cero usando el constructor
                  semanal abajo.
                </p>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Plan *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Plan Personalizado - Enero 2025"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setIsActive(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Marcar como plan activo
                  </Label>
                </div>
              </div>
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
              <p className="text-sm text-muted-foreground mb-2">
                {useTemplate && selectedTemplateId
                  ? "Puedes personalizar el plan de la plantilla seleccionada"
                  : "Construye el plan semanal agregando comidas para cada día"}
              </p>
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
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Asignando..." : "Asignar Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
