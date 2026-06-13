/* eslint-disable @typescript-eslint/no-var-requires */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
const pdf = require("pdf-parse-fork");
import mammoth from "mammoth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Split text into ~500 character chunks with overlap
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

// Simple embedding using Groq's chat model to summarize chunks
// (Groq doesn't support embeddings, so we store raw text and use keyword search)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text based on file type
    let text = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      const parsed = await pdf(buffer);
      text = parsed.text;
    } else if (fileName.endsWith(".docx")) {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file." },
        { status: 400 }
      );
    }

    // Save document record to Supabase
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ name: file.name, size: file.size })
      .select()
      .single();

    if (docError) throw docError;

    // Chunk the text
    const chunks = chunkText(text);

    // Save all chunks to Supabase
    const chunkRows = chunks.map((content) => ({
      document_id: doc.id,
      content: content.trim(),
    }));

    const { error: chunkError } = await supabase
      .from("chunks")
      .insert(chunkRows);

    if (chunkError) throw chunkError;

    return NextResponse.json({
      success: true,
      document: { id: doc.id, name: doc.name },
      chunks: chunks.length,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}