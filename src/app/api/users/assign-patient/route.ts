import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if ((session.user as any).role !== "nutritionist") {
      return NextResponse.json(
        { error: "Solo nutricionistas pueden asignar pacientes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { patientEmail } = body;
    if (!patientEmail)
      return NextResponse.json(
        { error: "Email del paciente requerido" },
        { status: 400 }
      );

    await connectDB();

    // Debug: check if user exists at all
    const userExists = await User.findOne({
      email: patientEmail.toLowerCase(),
    });
    console.log("User lookup:", {
      email: patientEmail.toLowerCase(),
      exists: !!userExists,
      role: userExists?.role,
    });

    const patient = await User.findOne({
      email: patientEmail.toLowerCase(),
      role: "patient",
    });

    if (!patient) {
      // More helpful error message
      if (userExists) {
        return NextResponse.json(
          {
            error: `Usuario encontrado pero no es paciente (rol: ${userExists.role})`,
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const nutritionistId = (session.user as any).id;
    if (patient._id.toString() === nutritionistId) {
      return NextResponse.json(
        { error: "No puedes asignarte a ti mismo" },
        { status: 400 }
      );
    }

    if (
      patient.assignedNutritionistId &&
      patient.assignedNutritionistId.toString() !== nutritionistId
    ) {
      return NextResponse.json(
        { error: "Paciente ya asignado a otro nutricionista" },
        { status: 409 }
      );
    }

    // Assign and force role to patient
    patient.assignedNutritionistId = nutritionistId;
    patient.role = "patient";
    await patient.save();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
