"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Issue {
  id: string;
  title: string;
  body: string;
  source_question: string;
  source_answer: string;
  status: "open" | "reviewing" | "resolved";
  created_at: string;
}

const COLUMNS = [
  { id: "open", label: "Open", color: "bg-red-500" },
  { id: "reviewing", label: "Reviewing", color: "bg-yellow-500" },
  { id: "resolved", label: "Resolved", color: "bg-green-500" },
];

export default function KanbanPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Issue | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setIssues(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("issues").update({ status }).eq("id", id);
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: status as any } : i))
    );
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: status as any } : null);
  };

  const deleteIssue = async (id: string) => {
    await supabase.from("issues").delete().eq("id", id);
    setIssues((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const getIssuesByStatus = (status: string) =>
    issues.filter((i) => i.status === status);

  const statusColor = (status: string) => {
    if (status === "open") return "text-red-400 bg-red-900/30 border-red-800";
    if (status === "reviewing") return "text-yellow-400 bg-yellow-900/30 border-yellow-800";
    return "text-green-400 bg-green-900/30 border-green-800";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back</a>
          <div className="w-px h-4 bg-gray-700" />
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-xs">D</div>
          <span className="font-semibold">DealRoom</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300">Risk Board</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{issues.length} total issues</span>
          <button onClick={fetchIssues} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
            Refresh
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Kanban columns */}
        <div className="flex-1 p-6 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4 h-full min-w-max">
              {COLUMNS.map((col) => {
                const colIssues = getIssuesByStatus(col.id);
                return (
                  <div key={col.id} className="w-72 flex flex-col gap-3">
                    {/* Column header */}
                    <div className="flex items-center gap-2 px-1">
                      <div className={`w-2 h-2 rounded-full ${col.color}`} />
                      <span className="text-sm font-semibold text-gray-300">{col.label}</span>
                      <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full ml-auto">
                        {colIssues.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                      {colIssues.length === 0 && (
                        <div className="border-2 border-dashed border-gray-800 rounded-xl p-6 text-center">
                          <p className="text-xs text-gray-600">No issues</p>
                        </div>
                      )}
                      {colIssues.map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => setSelected(issue)}
                          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-all"
                        >
                          <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mb-2 ${statusColor(issue.status)}`}>
                            {issue.status === "open" ? "⚠️" : issue.status === "reviewing" ? "🔍" : "✅"} {issue.status}
                          </div>
                          <p className="text-sm font-medium text-white leading-snug">{issue.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{issue.body?.slice(0, 100)}...</p>
                          <p className="text-xs text-gray-600 mt-2">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Issue detail panel */}
        {selected && (
          <aside className="w-96 border-l border-gray-800 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-white leading-snug">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-lg leading-none flex-shrink-0">×</button>
            </div>

            {/* Status buttons */}
            <div className="flex gap-2">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => updateStatus(selected.id, col.id)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${
                    selected.status === col.id
                      ? statusColor(col.id) + " font-semibold"
                      : "border-gray-700 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Question</p>
              <p className="text-sm text-gray-300 bg-gray-800 rounded-lg p-3">{selected.source_question}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Analysis</p>
              <p className="text-sm text-gray-300 bg-gray-800 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {selected.source_answer}
              </p>
            </div>

            <button
              onClick={() => deleteIssue(selected.id)}
              className="mt-auto text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 rounded-lg py-2 transition-colors"
            >
              Delete issue
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}