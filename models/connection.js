import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // ✅ charge le .env

const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected"))
  .catch(err => console.error(err));
