import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Meal, User, WeightLog } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { patientId } = params;
    await connectDB();

    // Get patient data
    const patient = await User.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Verify nutritionist has access
    if (
      (session.user as any).role === "nutritionist" &&
      patient.assignedNutritionistId?.toString() !== (session.user as any).id
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Get recent meals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const meals = await Meal.find({
      userId: patientId,
      timestamp: { $gte: thirtyDaysAgo },
    }).sort({ timestamp: -1 });

    // Get weight logs
    const weightLogs = await WeightLog.find({ userId: patientId }).sort({
      date: 1,
    });

    // Calculate BMI
    const bmi =
      patient.heightCm && patient.currentWeightKg
        ? (
            patient.currentWeightKg / Math.pow(patient.heightCm / 100, 2)
          ).toFixed(1)
        : "N/D";

    // Generate PDF content (HTML)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .header h1 {
      color: #10b981;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 5px 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #10b981;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
    }
    .info-item strong {
      color: #374151;
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }
    .info-item span {
      font-size: 16px;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>NutriTrack Pro</h1>
    <p>Informe del Paciente</p>
    <p>${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
  </div>

  <div class="section">
    <h2>Información del Paciente</h2>
    <div class="info-grid">
      <div class="info-item">
        <strong>Nombre</strong>
        <span>${patient.displayName}</span>
      </div>
      <div class="info-item">
        <strong>Email</strong>
        <span>${patient.email}</span>
      </div>
      <div class="info-item">
        <strong>Peso Actual</strong>
        <span>${patient.currentWeightKg || "N/D"} kg</span>
      </div>
      <div class="info-item">
        <strong>Peso Objetivo</strong>
        <span>${patient.goalWeightKg || "N/D"} kg</span>
      </div>
      <div class="info-item">
        <strong>Altura</strong>
        <span>${patient.heightCm || "N/D"} cm</span>
      </div>
      <div class="info-item">
        <strong>IMC</strong>
        <span>${bmi}</span>
      </div>
      <div class="info-item">
        <strong>Nivel de Actividad</strong>
        <span>${patient.activityLevel || "N/D"}</span>
      </div>
      <div class="info-item">
        <strong>Preferencias Dietéticas</strong>
        <span>${patient.dietaryPreferences || "N/D"}</span>
      </div>
    </div>
    ${
      patient.healthConditions
        ? `
    <div class="info-item" style="grid-column: 1 / -1;">
      <strong>Condiciones de Salud</strong>
      <span>${patient.healthConditions}</span>
    </div>
    `
        : ""
    }
  </div>

  ${
    weightLogs.length > 0
      ? `
  <div class="section">
    <h2>Historial de Peso</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Peso (kg)</th>
        </tr>
      </thead>
      <tbody>
        ${weightLogs
          .slice(-10)
          .map(
            (log) => `
        <tr>
          <td>${format(new Date(log.date), "d 'de' MMMM 'de' yyyy", {
            locale: es,
          })}</td>
          <td>${log.weightKg} kg</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  ${
    meals.length > 0
      ? `
  <div class="section">
    <h2>Registro de Comidas (Últimos 30 días)</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha y Hora</th>
          <th>Comida</th>
          <th>Tipo</th>
          <th>Calorías</th>
        </tr>
      </thead>
      <tbody>
        ${meals
          .slice(0, 20)
          .map(
            (meal) => `
        <tr>
          <td>${format(new Date(meal.timestamp), "d/MM/yyyy HH:mm")}</td>
          <td>${meal.name}</td>
          <td>${meal.mealType}</td>
          <td>${meal.calories || "N/D"}</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Este informe fue generado automáticamente por NutriTrack Pro</p>
    <p>© ${new Date().getFullYear()} NutriTrack Pro. Todos los derechos reservados.</p>
  </div>
</body>
</html>
    `;

    // For a real implementation, you would use a library like puppeteer or a PDF generation service
    // For now, we'll return HTML that can be printed to PDF by the browser
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${patient.displayName.replace(
          /\s+/g,
          "_"
        )}_informe_${format(new Date(), "yyyy-MM-dd")}.html"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
