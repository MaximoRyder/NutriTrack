import { Appointment, Availability } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// Helper function to parse time string (HH:mm) to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper function to generate time slots for a given day
function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = [];
  let currentMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  while (currentMinutes + slotDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    slots.push(timeStr);
    currentMinutes += slotDuration;
  }

  return slots;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const nutritionistId = searchParams.get("nutritionistId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!nutritionistId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "nutritionistId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Fetch nutritionist's availability
    const availability = await Availability.find({ nutritionistId });

    if (availability.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch existing appointments in the date range
    const existingAppointments = await Appointment.find({
      nutritionistId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ["pending", "confirmed"] },
    });

    // Generate available slots
    const availableSlots: { date: string; time: string; dateTime: Date }[] =
      [];

    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Find availability for this day of week
      const dayAvailability = availability.filter(
        (a) => a.dayOfWeek === dayOfWeek
      );

      for (const avail of dayAvailability) {
        // Generate time slots for this availability window
        const timeSlots = generateTimeSlots(
          avail.startTime,
          avail.endTime,
          avail.slotDuration
        );

        for (const timeSlot of timeSlots) {
          // Create full date-time
          const [hours, minutes] = timeSlot.split(":").map(Number);
          const slotDateTime = new Date(currentDate);
          slotDateTime.setHours(hours, minutes, 0, 0);

          // Skip past slots
          if (slotDateTime < new Date()) {
            continue;
          }

          // Check if slot is already booked
          const isBooked = existingAppointments.some((apt) => {
            const aptStart = new Date(apt.date);
            const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
            const slotEnd = new Date(
              slotDateTime.getTime() + avail.slotDuration * 60000
            );

            return (
              (slotDateTime >= aptStart && slotDateTime < aptEnd) ||
              (slotEnd > aptStart && slotEnd <= aptEnd) ||
              (slotDateTime <= aptStart && slotEnd >= aptEnd)
            );
          });

          if (!isBooked) {
            availableSlots.push({
              date: currentDate.toISOString().split("T")[0],
              time: timeSlot,
              dateTime: slotDateTime,
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
