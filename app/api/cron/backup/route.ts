import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from '@/lib/db';
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

export const maxDuration = 60; // max seconds for Vercel Pro, use 10 for free tier

export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database connection not initialized" },
        { status: 500 },
      );
    }
    // 1. Create/update health collection with a ping record
    const healthCollection = db.collection("health");
    await healthCollection.insertOne({
      status: "ok",
      checkedAt: new Date(),
      message: "Scheduled 15-day backup & health check",
    });

    // 2. Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // 3. Export each collection as JSON
    const attachments: { filename: string; content: string }[] = [];

    for (const name of collectionNames) {
      const docs = await db.collection(name).find({}).toArray();
      attachments.push({
        filename: `${name}.json`,
        content: JSON.stringify(docs, null, 2),
      });
    }

    // 4. Send email with all JSON files attached
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const now = new Date().toISOString().split("T")[0];

    await transporter.sendMail({
      from: `"DB Backup" <${process.env.EMAIL_USER}>`,
      to: process.env.BACKUP_EMAIL,
      subject: `🗄️ Database Backup — ${now}`,
      html: `
        <h2>Database Backup Report</h2>
        <p>Backup taken on <strong>${now}</strong></p>
        <p>Collections backed up:</p>
        <ul>
          ${collectionNames.map((n) => `<li>${n}</li>`).join("")}
        </ul>
        <p>Each collection is attached as a separate JSON file.</p>
        <p style="color:#888;font-size:12px;">This is an automated backup. Do not reply.</p>
      `,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: "application/json",
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Backup sent with ${attachments.length} collections`,
      collections: collectionNames,
    });
  } catch (err: any) {
    console.error("Backup cron error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}


