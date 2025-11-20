import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Mock sessions data (replace with database query in production)
const mockSessions = [
  {
    id: "1",
    date: "2024-12-01T10:00:00Z",
    type: "initial",
    duration: 60,
    notes: "Initial consultation - health assessment and goal setting",
    nutritionistId: "",
    patientId: "",
  },
  {
    id: "2",
    date: "2024-11-15T14:30:00Z",
    type: "followup",
    duration: 45,
    notes: "Follow-up - progress review",
    nutritionistId: "",
    patientId: "",
  },
  {
    id: "3",
    date: "2024-11-01T11:00:00Z",
    type: "checkup",
    duration: 30,
    notes: "Monthly check-up",
    nutritionistId: "",
    patientId: "",
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const nutritionistId = searchParams.get("nutritionistId");

    if (!patientId || !nutritionistId) {
      return NextResponse.json(
        { error: "Missing patientId or nutritionistId" },
        { status: 400 }
      );
    }

    // In production, query your database for sessions
    // For now, return mock data with the provided IDs
    const sessions = mockSessions.map((s) => ({
      ...s,
      patientId,
      nutritionistId,
    }));

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, type, duration, notes, nutritionistId, patientId } = body;

    // Validation
    if (!date || !type || !nutritionistId || !patientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, save to database
    const newSession = {
      id: Date.now().toString(),
      date,
      type,
      duration: duration || 45,
      notes: notes || "",
      nutritionistId,
      patientId,
    };

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
