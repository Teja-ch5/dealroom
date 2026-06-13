import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Simple keyword search across chunks
async function searchChunks(query: string, limit = 8) {
  const keywords = query
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 5);

  if (keywords.length === 0) {
    const { data } = await supabase
      .from("chunks")
      .select("id, content, document_id, documents(name)")
      .limit(limit);
    return data || [];
  }

  // Search for each keyword and combine results
  const results: any[] = [];
  for (const keyword of keywords) {
    const { data } = await supabase
      .from("chunks")
      .select("id, content, document_id, documents(name)")
      .ilike("content", `%${keyword}%`)
      .limit(limit);
    if (data) results.push(...data);
  }

  // Deduplicate by chunk id
  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).slice(0, limit);
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // Find relevant chunks
    const chunks = await searchChunks(question);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant information in the uploaded documents. Please upload some documents first.",
        sources: [],
        isRisk: false,
      });
    }

    // Build context from chunks
    const context = chunks
      .map((c: any, i: number) => {
        const docName = c.documents?.name || "Unknown document";
        return `[Source ${i + 1} - ${docName}]:\n${c.content}`;
      })
      .join("\n\n");

    // Ask Groq with context
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a financial due diligence analyst assistant. 
Answer questions based ONLY on the provided document context.
Be precise and cite which source you're using (e.g. "According to [Source 1]...").
If you identify a potential risk, start your answer with "⚠️ RISK DETECTED:".
If you cannot find the answer in the context, say so clearly.`,
        },
        {
          role: "user",
          content: `Context from documents:\n\n${context}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "No answer generated.";
    const isRisk = answer.includes("⚠️ RISK DETECTED:");

    // Build sources list
    const sources = chunks.map((c: any) => ({
      documentName: c.documents?.name || "Unknown",
      excerpt: c.content.slice(0, 120) + "...",
    }));

    // Auto-create issue if risk detected
    if (isRisk) {
      const title = question.slice(0, 80);
      await supabase.from("issues").insert({
        title,
        body: answer,
        source_question: question,
        source_answer: answer,
        status: "open",
      });
    }

    return NextResponse.json({ answer, sources, isRisk });
  } catch (error: any) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: error.message || "Query failed" },
      { status: 500 }
    );
  }
}