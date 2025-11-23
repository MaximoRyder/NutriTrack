import { Appointment } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    const query: any =
      role === "patient"
        ? { patientId: userId }
        : { nutritionistId: userId };

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("nutritionistId", "displayName email photoUrl")
      .populate("patientId", "displayName email photoUrl")
      .sort({ date: 1 });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { nutritionistId, patientId, date, duration, type, notes } = body;

    // Validate required fields
    if (!nutritionistId || !patientId || !date || !duration || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const appointmentDate = new Date(date);
    const endDate = new Date(appointmentDate.getTime() + duration * 60000);

    const conflict = await Appointment.findOne({
      nutritionistId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          date: { $gte: appointmentDate, $lt: endDate },
        },
        {
          $expr: {
            $and: [
              { $lte: ["$date", appointmentDate] },
              {
                $gt: [
                  { $add: ["$date", { $multiply: ["$duration", 60000] }] },
                  appointmentDate,
                ],
              },
            ],
          },
        },
      ],
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Time slot is already booked" },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await Appointment.create({
      nutritionistId,
      patientId,
      date: appointmentDate,
      duration,
      type,
      notes,
      status: "pending",
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("nutritionistId", "displayName email photoUrl")
      .populate("patientId", "displayName email photoUrl");

    return NextResponse.json(populatedAppointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { id, status, notes, date } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    // If date is being updated, check for conflicts
    if (date) {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      const newDate = new Date(date);
      const endDate = new Date(newDate.getTime() + appointment.duration * 60000);

      // Check for conflicts (excluding the current appointment)
      const conflict = await Appointment.findOne({
        _id: { $ne: id },
        nutritionistId: appointment.nutritionistId,
        status: { $in: ["pending", "confirmed"] },
        $or: [
          {
            date: { $gte: newDate, $lt: endDate },
          },
          {
            $expr: {
              $and: [
                { $lte: ["$date", newDate] },
                {
                  $gt: [
                    { $add: ["$date", { $multiply: ["$duration", 60000] }] },
                    newDate,
                  ],
                },
              ],
            },
          },
        ],
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Time slot is already booked" },
          { status: 409 }
        );
      }

      updateData.date = newDate;
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("nutritionistId", "displayName email photoUrl")
      .populate("patientId", "displayName email photoUrl");

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Instead of deleting, mark as cancelled
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    )
      .populate("nutritionistId", "displayName email photoUrl")
      .populate("patientId", "displayName email photoUrl");

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
