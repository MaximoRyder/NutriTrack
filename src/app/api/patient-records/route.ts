import { PatientRecord, User, WeightLog } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json(
      { error: "Patient ID is required" },
      { status: 400 }
    );
  }

  try {
    const records = await PatientRecord.find({ patientId })
      .sort({ date: -1 })
      .populate("nutritionistId", "displayName");
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const body = await request.json();
    const {
      patientId,
      nutritionistId,
      date,
      weightKg,
      heightCm,
      bodyFatPercentage,
      visceralFatPercentage,
      notes,
    } = body;

    // Create the record
    const record = await PatientRecord.create({
      patientId,
      nutritionistId,
      date,
      weightKg,
      heightCm,
      bodyFatPercentage,
      visceralFatPercentage,
      notes,
    });

    // Update patient profile with latest stats
    await User.findByIdAndUpdate(patientId, {
      currentWeightKg: weightKg,
      heightCm,
      bodyFatPercentage,
      visceralFatPercentage,
    });

    // Also create a WeightLog entry to keep the weight chart consistent
    // Check if a weight log already exists for this date to avoid duplicates?
    // For simplicity, we'll just add a new one or update if we want to be stricter.
    // Let's just create one.
    await WeightLog.create({
      userId: patientId,
      date: date,
      weightKg: weightKg,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating patient record:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}
