"use client";

import { AddPatientDialog } from "@/components/add-patient-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePatients } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { MoreHorizontal, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PatientsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAddPatientDialogOpen, setAddPatientDialogOpen] = useState(false);

  const { patients, isLoading: isLoadingPatients, mutate } = usePatients();

  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handlePatientAdded = () => {
    mutate();
  };

  return (
    <>
      <AddPatientDialog
        isOpen={isAddPatientDialogOpen}
        onOpenChange={setAddPatientDialogOpen}
        onPatientAdded={handlePatientAdded}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("patients.title")}</CardTitle>
            <CardDescription>{t("patients.description")}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddPatientDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("patients.addPatient")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("patients.patient")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("patients.status")}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t("patients.lastLog")}
                </TableHead>
                <TableHead>{t("patients.alerts")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("patients.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPatients ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : patients && patients.length > 0 ? (
                patients.map((patient: any) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer"
                    onClick={() => handleViewPatient(patient.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={(patient as any).photoUrl}
                            alt={patient.displayName}
                          />
                          <AvatarFallback>
                            {patient.displayName
                              ? patient.displayName.charAt(0)
                              : "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{patient.displayName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={"outline"}>
                        {t(`patients.statusActive`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {t("patients.notAvailable")}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {t("patients.noAlerts")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">
                              {t("patients.toggleMenu")}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t("patients.actions")}
                          </DropdownMenuLabel>
                          <Link href={`/patients/${patient.id}`} passHref>
                            <DropdownMenuItem>
                              {t("patients.viewDetails")}
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>
                            {t("patients.sendMessage")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            {t("patients.unassign")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t("patients.noPatients")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
