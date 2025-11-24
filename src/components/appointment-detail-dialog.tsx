"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { Calendar, Clock, FileText, User } from "lucide-react";

interface AppointmentDetailDialogProps {
  appointment: {
    _id: string;
    date: string;
    type: "initial" | "followup" | "checkup";
    duration: number;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    notes?: string;
    patientId: {
      displayName: string;
      email: string;
      photoUrl?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentDetailDialog({
  appointment,
  isOpen,
  onClose,
}: AppointmentDetailDialogProps) {
  const { t, locale } = useTranslation();
  const dateLocales = { en: enUS, es: es, pt: ptBR };
  const currentLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("appointments.detailTitle")}</DialogTitle>
          <DialogDescription>{t("appointments.detailDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {appointment.patientId?.displayName || t("general.na")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {appointment.patientId?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                {t("appointments.table.dateTime")}
              </Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(appointment.date), "PPP", {
                    locale: currentLocale,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(appointment.date), "p", {
                    locale: currentLocale,
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                {t("appointments.table.status")}
              </Label>
              <div>
                <Badge
                  variant={
                    appointment.status === "confirmed" ? "default" : "secondary"
                  }
                >
                  {t(`appointments.status.${appointment.status}`)}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                {t("appointments.table.type")}
              </Label>
              <div>
                <Badge variant="outline">
                  {t(`appointments.types.${appointment.type}`)}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                {t("appointments.duration")}
              </Label>
              <div className="text-sm font-medium">
                {appointment.duration} min
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("appointments.notes")}
              </Label>
              <div className="rounded-md bg-muted p-3 text-sm">
                {appointment.notes}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t("general.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
