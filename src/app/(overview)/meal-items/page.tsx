"use client";

import { CreateMealItemDialog } from "@/components/create-meal-item-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { MealItem } from "@/lib/types";
import { Clock, Edit2, Image as ImageIcon, Plus, Search, Trash2, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function MealItemsPage() {
  const { data: session } = useSession();
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MealItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MealItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MealItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMealItems = async () => {
    try {
      const response = await fetch(`/api/meal-items`);
      if (response.ok) {
        const data = await response.json();
        setMealItems(data);
        setFilteredItems(data);
      }
    } catch (error) {
      console.error("Error fetching meal items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchMealItems();
    }
  }, [session]);

  useEffect(() => {
    let filtered = mealItems;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by meal type
    if (mealTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.mealType === mealTypeFilter);
    }

    setFilteredItems(filtered);
  }, [searchQuery, mealTypeFilter, mealItems]);

  const handleSaveMealItem = async (mealItemData: Partial<MealItem>) => {
    try {
      if (itemToEdit) {
        // Update existing
        const response = await fetch(`/api/meal-items?id=${itemToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mealItemData),
        });

        if (response.ok) {
          await fetchMealItems();
          setItemToEdit(null);
        }
      } else {
        // Create new
        const response = await fetch("/api/meal-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mealItemData),
        });

        if (response.ok) {
          await fetchMealItems();
        }
      }
    } catch (error) {
      console.error("Error saving meal item:", error);
    }
  };

  const handleDeleteMealItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/meal-items?id=${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMealItems();
        setItemToDelete(null);
      } else {
        const error = await response.json();
        alert(error.error || "Error al eliminar la comida");
      }
    } catch (error) {
      console.error("Error deleting meal item:", error);
      alert("Error al eliminar la comida");
    }
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: "Desayuno",
      lunch: "Almuerzo",
      dinner: "Cena",
      snack: "Merienda",
      other: "Otro",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Comidas</h1>
          <p className="text-muted-foreground">
            Gestiona tus comidas reutilizables
          </p>
        </div>
        <Button
          onClick={() => {
            setItemToEdit(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Comida
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar comidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo de comida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="breakfast">Desayuno</SelectItem>
            <SelectItem value="lunch">Almuerzo</SelectItem>
            <SelectItem value="dinner">Cena</SelectItem>
            <SelectItem value="snack">Merienda</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meal Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando comidas...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || mealTypeFilter !== "all"
                ? "No se encontraron comidas con los filtros aplicados"
                : "No tienes comidas creadas. ¡Crea tu primera comida!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.photoUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={item.photoUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {getMealTypeLabel(item.mealType)}
                  </Badge>
                </div>
                {(item.portionInfo || item.recommendedTime) && (
                  <CardDescription className="space-y-1">
                    {item.portionInfo && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium">Porción:</span>
                        {item.portionInfo}
                      </div>
                    )}
                    {item.recommendedTime && (
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {item.recommendedTime}
                      </div>
                    )}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  {item.photoUrl && (
                    <Badge variant="outline" className="text-xs">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Foto
                    </Badge>
                  )}
                  {item.videoUrl && (
                    <Badge variant="outline" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setItemToEdit(item);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemToDelete(item)}
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
      <CreateMealItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveMealItem}
        mealItemToEdit={itemToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comida?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{itemToDelete?.title}"? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMealItem}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
