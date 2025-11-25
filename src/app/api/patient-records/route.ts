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

// Helper to update patient profile with latest stats
async function updatePatientProfile(patientId: string) {
  const latestRecord = await PatientRecord.findOne({ patientId }).sort({ date: -1 });
  
  if (!latestRecord) return;

  const updateData: any = {};
  if (latestRecord.bodyFatPercentage !== undefined) updateData.bodyFatPercentage = latestRecord.bodyFatPercentage;
  if (latestRecord.visceralFatPercentage !== undefined) updateData.visceralFatPercentage = latestRecord.visceralFatPercentage;
  if (latestRecord.muscleMassPercentage !== undefined) updateData.muscleMassPercentage = latestRecord.muscleMassPercentage;
  if (latestRecord.chestCm !== undefined) updateData["bodyMeasurements.chest"] = latestRecord.chestCm;
  if (latestRecord.waistCm !== undefined) updateData["bodyMeasurements.waist"] = latestRecord.waistCm;
  if (latestRecord.hipsCm !== undefined) updateData["bodyMeasurements.hips"] = latestRecord.hipsCm;
  if (latestRecord.weightKg) updateData.currentWeightKg = latestRecord.weightKg;

  if (Object.keys(updateData).length > 0) {
    await User.findByIdAndUpdate(patientId, updateData);
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
      bodyFatPercentage,
      visceralFatPercentage,
      muscleMassPercentage,
      chestCm,
      waistCm,
      hipsCm,
      notes,
    });

    // Smart update: Update patient profile based on the latest record (which might be this one or a newer one)
    await updatePatientProfile(patientId);

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

export async function PATCH(request: Request) {
  await connectDB();
  try {
    const body = await request.json();
    const { _id, ...updateFields } = body;

    if (!_id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const record = await PatientRecord.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Smart update: Update patient profile based on the latest record
    await updatePatientProfile(record.patientId);

    // Update WeightLog if weight or date changed
    // Simplification: If weight is present in update, find log by date and update, or create if not exists
    if (updateFields.weightKg !== undefined && updateFields.date) {
        // Try to find a weight log for this user and date
        const dateStart = new Date(updateFields.date);
        dateStart.setHours(0,0,0,0);
        const dateEnd = new Date(updateFields.date);
        dateEnd.setHours(23,59,59,999);

        const weightLog = await WeightLog.findOne({
            userId: record.patientId,
            date: { $gte: dateStart, $lte: dateEnd }
        });

        if (weightLog) {
            weightLog.weightKg = updateFields.weightKg;
            await weightLog.save();
        } else {
             await WeightLog.create({
                userId: record.patientId,
                date: updateFields.date,
                weightKg: updateFields.weightKg,
            });
        }
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error updating patient record:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update record" },
      { status: 500 }
    );
  }
}
