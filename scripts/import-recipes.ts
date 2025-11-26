import * as dotenv from "dotenv";
import * as fs from "fs";
import { MongoClient } from "mongodb";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nutritrack";
const TARGET_EMAIL = "maxnutri@gmail.com";

async function importRecipes() {
  if (!MONGODB_URI) {
    console.error("Please define MONGODB_URI in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // 1. Find the nutritionist
    const user = await db.collection("users").findOne({ email: TARGET_EMAIL });

    if (!user) {
      console.error(`User with email ${TARGET_EMAIL} not found.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.displayName} (${user._id})`);

    // 2. Read the JSON file
    const jsonPath = path.resolve(__dirname, "recipes.json");
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    // Remove comments from JSON (simple regex for /* ... */)
    const jsonCleaned = fileContent.replace(/\/\*[\s\S]*?\*\//g, "");
    const recipes = JSON.parse(jsonCleaned);

    console.log(`Found ${recipes.length} recipes to import.`);

    // 3. Map and insert recipes
    const mealItems = recipes.map((recipe: any) => {
      let mealType = "other";
      const typeLower = recipe.tipo.toLowerCase();
      if (typeLower.includes("desayuno")) mealType = "breakfast";
      else if (typeLower.includes("almuerzo")) mealType = "lunch";
      else if (typeLower.includes("cena")) mealType = "dinner";
      else if (typeLower.includes("merienda")) mealType = "snack";

      return {
        nutritionistId: user._id.toString(),
        title: recipe.titulo,
        description: recipe.descripcion,
        photoUrl: recipe.imagen_url,
        videoUrl: null,
        mealType: mealType,
        portionInfo: recipe.porciones,
        recommendedTime: recipe.horario_recomendado,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const result = await db.collection("mealItems").insertMany(mealItems);

    console.log(`Successfully imported ${result.insertedCount} recipes!`);

  } catch (error) {
    console.error("Error importing recipes:", error);
  } finally {
    await client.close();
  }
}

importRecipes();
