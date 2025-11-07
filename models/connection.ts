import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // charge le .env

const connectionString = process.env.CONNECTION_STRING;

if (!connectionString) {
  throw new Error("❌ Missing CONNECTION_STRING in environment variables");
}

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Database connection error:", err));
