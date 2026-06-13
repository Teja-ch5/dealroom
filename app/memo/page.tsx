"use client";
import { useState } from "react";

export default function MemoPage() {
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [issueCount, setIssueCount] = useState(0);
  const [generated, setGenerated] = useState(false);

  const generateMemo = async () => {
    setLoading(true);
    setMemo("");
    try {
      const res = await fetch("/api/memo", { method: "POST" });
      const data = await res.json();
      if (data.memo) {
        setMemo(data.memo);
        setIssueCount(data.issueCount);
        setGenerated(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Failed to generate memo.");
    } finally {
      setLoading(false);
    }
  };

  const printMemo = () => window.print();

  // Simple markdown renderer
  const renderMemo = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-lg font-bold text-white mt-6 mb-2 pb-1 border-b border-gray-700">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-semibold text-gray-200 mt-3">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-gray-300 text-sm ml-4 mt-1 list-disc">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      return (
        <p key={i} className="text-gray-300 text-sm leading-relaxed mt-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col print:bg-white print:text-black">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-sm">D</div>
            <span className="text-lg font-semibold">DealRoom</span>
          </a>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">Deal Memo</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/kanban" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Risk Board
          </a>
          {generated && (
            <button
              onClick={printMemo}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Export PDF 🖨️
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {!generated ? (
          /* Generate screen */
          <div className="flex flex-col items-center justify-center min-h-96 gap-6 text-center">
            <div className="w-20 h-20 bg-violet-600/20 rounded-2xl flex items-center justify-center text-4xl">📋</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generate Deal Memo</h1>
              <p className="text-gray-400 mt-2 max-w-md">
                Compiles all your uploaded documents and identified risks into a structured deal memo ready to share.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Executive Summary
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Key Risks
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Financial Highlights
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Legal & Compliance
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Recommendation
              </div>
            </div>
            <button
              onClick={generateMemo}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating memo...
                </>
              ) : (
                "Generate Deal Memo"
              )}
            </button>
          </div>
        ) : (
          /* Memo view */
          <div>
            {/* Memo header */}
            <div className="flex items-start justify-between mb-8 print:mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white print:text-black">Deal Memo</h1>
                <p className="text-gray-400 text-sm mt-1 print:text-gray-600">
                  Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  {issueCount > 0 && ` · ${issueCount} issues reviewed`}
                </p>
              </div>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => { setGenerated(false); setMemo(""); }}
                  className="text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={printMemo}
                  className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Memo content */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 print:bg-white print:border-gray-200 print:rounded-none print:p-0">
              <div className="prose prose-invert max-w-none">
                {renderMemo(memo)}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center print:hidden">
              <p className="text-xs text-gray-600">
                Generated by DealRoom AI · Powered by Groq + Llama 3.3 70B · For review purposes only
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}