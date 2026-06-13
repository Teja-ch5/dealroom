"use client";
import { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { documentName: string; excerpt: string }[];
  isRisk?: boolean;
}

interface Document {
  id: string;
  name: string;
  chunks: number;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => [
          ...prev,
          { id: data.document.id, name: data.document.name, chunks: data.chunks },
        ]);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (e) {
      alert("Upload error. Check console.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) await uploadFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) await uploadFile(file);
  };

  const askQuestion = async () => {
    if (!question.trim() || asking) return;
    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setAsking(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error,
          sources: data.sources,
          isRisk: data.isRisk,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error getting answer. Try again." },
      ]);
    } finally {
      setAsking(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-sm">D</div>
          <span className="text-lg font-semibold">DealRoom</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">AI-native M&A due diligence</span>
        </div>
        <a href="/kanban" className="text-sm text-gray-400 hover:text-white transition-colors">
          Risk Board →
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-800 p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Documents</p>
            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragging ? "border-violet-500 bg-violet-500/10" : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.docx,.txt" onChange={handleFileInput} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">Indexing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">📄</div>
                  <p className="text-xs text-gray-400">Drop files or click</p>
                  <p className="text-xs text-gray-600">PDF, DOCX, TXT</p>
                </div>
              )}
            </div>
          </div>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{doc.chunks} chunks indexed</p>
                  <div className="mt-1.5 h-1 bg-gray-700 rounded-full">
                    <div className="h-1 bg-violet-500 rounded-full w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {documents.length === 0 && (
            <div className="text-xs text-gray-600 text-center mt-2">
              Upload documents to get started
            </div>
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-violet-600/20 rounded-2xl flex items-center justify-center text-3xl">🔍</div>
                <div>
                  <p className="text-lg font-medium text-gray-300">Ask anything about your documents</p>
                  <p className="text-sm text-gray-600 mt-1">Upload files on the left, then ask questions here</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {["What are the biggest revenue risks?", "Are there any change-of-control clauses?", "Summarize the financials"].map((q) => (
                    <button key={q} onClick={() => setQuestion(q)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl ${msg.role === "user" ? "bg-violet-600 text-white" : msg.isRisk ? "bg-red-950 border border-red-800" : "bg-gray-800"} rounded-2xl px-4 py-3`}>
                  {msg.isRisk && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-red-400 bg-red-900/50 px-2 py-0.5 rounded-full">⚠️ Risk Detected — Issue Created</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-1">
                      {msg.sources.slice(0, 3).map((s, j) => (
                        <span key={j} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                          📎 {s.documentName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {asking && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-3 items-end">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
                placeholder="Ask anything about your documents..."
                rows={1}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={askQuestion}
                disabled={!question.trim() || asking}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              >
                Ask
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </main>
      </div>
    </div>
  );
}