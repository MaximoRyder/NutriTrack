import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== "patient") {
      return NextResponse.json({ error: "Solo pacientes" }, { status: 403 });
    }

    const body = await request.json();
    const { invitationCode } = body;
    if (!invitationCode) {
      return NextResponse.json(
        { error: "Código de invitación requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    const patient = await User.findById(userId);
    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    if (patient.assignedNutritionistId) {
      return NextResponse.json(
        { error: "Paciente ya asignado" },
        { status: 409 }
      );
    }

    const nutritionist = await User.findOne({
      role: "nutritionist",
      invitationCode: invitationCode.trim(),
    });
    if (!nutritionist) {
      return NextResponse.json({ error: "Código inválido" }, { status: 404 });
    }

    patient.assignedNutritionistId = nutritionist._id;
    await patient.save();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
