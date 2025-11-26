import { User } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import {
    EMAIL_MAX_LENGTH,
    EMAIL_REGEX,
    NAME_MAX_LENGTH,
} from "@/lib/validation";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, role } = body;

    if (!email || !password || !displayName || !role) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (
      !EMAIL_REGEX.test(email) ||
      email.length > EMAIL_MAX_LENGTH ||
      displayName.length > NAME_MAX_LENGTH
    ) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the admin user
    let finalRole = role;
    if (email.toLowerCase() === "admin@nutritrack.pro") {
      finalRole = "admin";
    }

    const userData: any = {
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
      role: finalRole,
      createdAt: new Date(),
    };

    // Add nutritionist-specific fields
    if (finalRole === "nutritionist") {
      userData.invitationCode = `${displayName
        .replace(/\s+/g, "")
        .toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
      userData.subscriptionStatus = "pending";
    }

    const user = await User.create(userData);

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
