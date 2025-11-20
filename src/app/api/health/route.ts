import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const isConnected = mongoose.connection.readyState === 1;
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;

    return NextResponse.json({
      status: "ok",
      mongodb: {
        connected: isConnected,
        database: dbName,
        host: host,
        readyState: mongoose.connection.readyState,
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        mongodb: {
          connected: false,
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
