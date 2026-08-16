"use client";

import { Users } from "lucide-react";
import { EmployeeList } from "./employee-list";

export default function HRPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Personal (RRHH)</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          Gestioná tu equipo: perfiles, salarios, horarios e invitaciones por correo.
        </p>
      </div>
      <EmployeeList />
    </div>
  );
}