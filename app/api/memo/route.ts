import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // Fetch all issues
    const { data: issues } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch sample chunks for context
    const { data: chunks } = await supabase
      .from("chunks")
      .select("content, documents(name)")
      .limit(20);

    const issuesSummary =
      issues && issues.length > 0
        ? issues
            .map(
              (i: any) =>
                `- [${i.status.toUpperCase()}] ${i.title}: ${i.body?.slice(0, 200)}`
            )
            .join("\n")
        : "No issues identified yet.";

    const docContext =
      chunks && chunks.length > 0
        ? chunks
            .map((c: any) => `[${c.documents?.name}]: ${c.content}`)
            .join("\n\n")
            .slice(0, 4000)
        : "No documents uploaded yet.";

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a senior M&A analyst writing a professional deal memo. 
Write in clear, concise business language. Use markdown formatting with ## headers.
Be direct and actionable. Flag risks clearly.`,
        },
        {
          role: "user",
          content: `Based on the following document extracts and identified issues, write a comprehensive deal memo.

DOCUMENT EXTRACTS:
${docContext}

IDENTIFIED ISSUES AND RISKS:
${issuesSummary}

Write a deal memo with these exact sections:
## Executive Summary
## Key Risks
## Financial Highlights  
## Legal & Compliance
## Recommendation

Be specific, professional, and concise.`,
        },
      ],
      max_tokens: 2048,
      temperature: 0.4,
    });

    const memo = completion.choices[0]?.message?.content || "Failed to generate memo.";

    return NextResponse.json({ memo, issueCount: issues?.length || 0 });
  } catch (error: any) {
    console.error("Memo error:", error);
    return NextResponse.json(
      { error: error.message || "Memo generation failed" },
      { status: 500 }
    );
  }
}