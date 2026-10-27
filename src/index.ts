import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import authRouter from "./routes/auth";
import resolveRouter from "./routes/resolve";
import marketRouter from "./routes/market";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/resolve", resolveRouter);
app.use("/api/v1/market", marketRouter);

const PORT = process.env.PORT || 3000;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  await mongoose.connect(databaseUrl);
  console.log("MongoDB connected");

  app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port 3000");
  });
}

main().catch(console.error);
