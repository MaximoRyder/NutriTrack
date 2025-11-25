import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await connectDB();
    if (id) {
      const user = await User.findById(id);
      if (!user)
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      return NextResponse.json({
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        photoUrl: user.photoUrl,
        createdAt: user.createdAt,
        assignedNutritionistId: user.assignedNutritionistId?.toString() || null,
        goalWeightKg: user.goalWeightKg,
        currentWeightKg: user.currentWeightKg,
        heightCm: user.heightCm,
        activityLevel: user.activityLevel,
        dietaryPreferences: user.dietaryPreferences,
        healthConditions: user.healthConditions,
        subscriptionStatus: user.subscriptionStatus || null,
        invitationCode: user.invitationCode || null,
        specialty: user.specialty || null,
        dateOfBirth: user.dateOfBirth || null,
        bodyMeasurements: user.bodyMeasurements || null,
        bodyFatPercentage: user.bodyFatPercentage || null,
        visceralFatPercentage: user.visceralFatPercentage || null,
        muscleMassPercentage: user.muscleMassPercentage || null,
        goalBodyFatPercentage: user.goalBodyFatPercentage || null,
        goalVisceralFatPercentage: user.goalVisceralFatPercentage || null,
        goalMuscleMassPercentage: user.goalMuscleMassPercentage || null,
      });
    }
    // Admin: List all users
    if ((session.user as any).role === "admin") {
      const allUsers = await User.find({}).sort({ createdAt: -1 });
      return NextResponse.json(
        allUsers.map((u) => ({
          id: u._id.toString(),
          displayName: u.displayName,
          email: u.email,
          role: u.role,
          photoUrl: u.photoUrl,
          createdAt: u.createdAt,
          subscriptionStatus: u.subscriptionStatus || null,
        }))
      );
    }
    // List patients for a nutritionist
    if ((session.user as any).role === "nutritionist") {
      const patients = await User.find({
        assignedNutritionistId: (session.user as any).id,
      });
      return NextResponse.json(
        patients.map((p) => ({
          id: p._id.toString(),
          displayName: p.displayName,
          email: p.email,
          photoUrl: p.photoUrl || null,
          subscriptionStatus: p.subscriptionStatus || null,
        }))
      );
    }
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const { id, currentPassword, password: newPassword, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Only admin can update other users
    const isAdmin = (session.user as any).role === "admin";
    const isSelf = (session.user as any).id === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Password change (self only unless admin)
    if (newPassword) {
      if (!isSelf && !isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      const userDoc = await User.findById(id).select("password");
      if (!userDoc) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }
      // Admin can force change without current password
      if (!isAdmin) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Contraseña actual requerida" },
            { status: 400 }
          );
        }
        const matches = await bcrypt.compare(
          currentPassword,
          (userDoc as any).password
        );
        if (!matches) {
          return NextResponse.json(
            { error: "Contraseña actual incorrecta" },
            { status: 400 }
          );
        }
      }
      const salt = await bcrypt.genSalt(10);
      (updates as any).password = await bcrypt.hash(newPassword, salt);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
