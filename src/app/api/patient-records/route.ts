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
      // heightCm, // Removed
      bodyFatPercentage,
      visceralFatPercentage,
      muscleMassPercentage,
      chestCm,
      waistCm,
      hipsCm,
      notes,
    } = body;

    // Create the record
    const record = await PatientRecord.create({
      patientId,
      nutritionistId,
      date,
      weightKg,
      // heightCm,
      bodyFatPercentage,
      visceralFatPercentage,
      muscleMassPercentage,
      chestCm,
      waistCm,
      hipsCm,
      notes,
    });

    // Update patient profile with latest stats
    const updateData: any = {};
    if (bodyFatPercentage !== undefined) updateData.bodyFatPercentage = bodyFatPercentage;
    if (visceralFatPercentage !== undefined) updateData.visceralFatPercentage = visceralFatPercentage;
    if (muscleMassPercentage !== undefined) updateData.muscleMassPercentage = muscleMassPercentage;
    if (chestCm !== undefined) updateData["bodyMeasurements.chest"] = chestCm;
    if (waistCm !== undefined) updateData["bodyMeasurements.waist"] = waistCm;
    if (hipsCm !== undefined) updateData["bodyMeasurements.hips"] = hipsCm;
    if (weightKg) updateData.currentWeightKg = weightKg;

    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(patientId, updateData);
    }

    // Also create a WeightLog entry to keep the weight chart consistent
    if (weightKg) {
      await WeightLog.create({
        userId: patientId,
        date: date,
        weightKg: weightKg,
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("Error creating patient record:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create record" },
      { status: 500 }
    );
  }
}
