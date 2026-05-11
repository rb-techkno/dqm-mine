import { useState, useEffect } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getRecommendations, getQualityData, queryAiAgent } from "../api";
import { Sparkles, Shield, Database, Zap, ArrowRight, CheckCircle2, X, Wrench, Building2, Play, RefreshCw } from "lucide-react";

const iconMap = {
  Security: Shield,
  Quality: Database,
  Performance: Zap,
};

const colorMap = {
  Security: "text-red-400",
  Quality: "text-yellow-400",
  Performance: "text-blue-400",
};

const bgMap = {
  Security: "bg-red-500/10",
  Quality: "bg-yellow-500/10",
  Performance: "bg-blue-500/10",
};

const PRESETS = [
  "Scan all schemas for cross-domain data contamination",
  "Find all tables missing primary keys and explain the business risk",
  "Check referential integrity across all foreign key relationships",
  "Find tables with high null rates in critical business columns",
  "Which schemas have the most tables and what do they likely represent?",
  "Suggest 5 indexes that would most improve query performance",
  "Score the star schema readiness of the data warehouse schemas",
  "Identify overloaded tables serving multiple entity types",
];

function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [resolutionView, setResolutionView] = useState(null); // null, 'manual', or 'organizational'
  const [model , setModel] = useState("gemini-2.5-flash-lite");
  const [apiKey, setApiKey] = useState("");

  // AI Agent States
  const [agentQ, setAgentQ] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [running, setRunning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getRecommendations();
      setData(result);
      console.log(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAgent = async (model, apiKey) => {
    if (!agentQ.trim()) return;
    setRunning(true);
    setAiOutput("");

    try {
      const response = await queryAiAgent(agentQ, model, apiKey);
      setAiOutput(response);
    } catch (err) {
      setAiOutput(`Error: ${err.message}. Please check your database connection.`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!data) return null; // Add this guard clause

  const openResolveModal = (item) => {
    setSelectedRecommendation(item);
    setResolveModalOpen(true);
    setResolutionView(null);
  };

  const closeResolveModal = () => {
    setResolveModalOpen(false);
    setSelectedRecommendation(null);
    setResolutionView(null);
  };

  return (
    <div className="space-y-6">
      <div 
        className="flex items-center gap-3 rounded-lg border p-4"
        style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)" }}
      >
        <div 
          className="rounded p-2"
          style={{ backgroundColor: "var(--bg-toggle)", color: "var(--primary)" }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AI-Generated Insights</h3>
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>These recommendations are based on your recent data quality and governance scans.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {data.recommendations.map((item, idx) => {
          const Icon = iconMap[item.category] || Sparkles;
          return (
            <Card key={idx} title={item.title} className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant={item.impact === 'High' ? 'critical' : 'warning'}>
                  {item.impact} Impact
                </Badge>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{item.category}</span>
              </div>
              
              <p className="mb-6 flex-grow text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <div className="rounded p-1.5" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{item.action}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openResolveModal(item)}
                  className="flex items-center gap-1 text-xs font-bold transition-colors"
                  style={{ color: "var(--primary-light)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--primary-light)"}
                >
                  Resolve <ArrowRight size={14} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

<Card title="AUTONOMOUS DATABASE AGENT" className="border-l-4" style={{ borderLeftColor: "var(--primary)" }}>
  <div className="space-y-6">

    {/* Model Selector */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Provider */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Model
        </label>

<select
  value={model}
  onChange={(e) => setModel(e.target.value)}
  className="px-3 py-2 rounded-lg border text-xs font-medium"
  style={{
    backgroundColor: "var(--bg-card)",
    borderColor: "var(--border-default)",
    color: "var(--text-primary)"
  }}
>
  {/* Existing */}
  <option value="gemini-2.5-flash-lite">
    gemini-2.5-flash-lite
  </option>

  <option value="openrouter">
    openrouter
  </option>

  <option value="groq">
    groq
  </option>

  {/* OpenAI */}
  <option value="gpt-5">
    gpt-5
  </option>

  <option value="gpt-4o">
    gpt-4o
  </option>

  {/* Anthropic */}
  <option value="claude-sonnet-4">
    claude-sonnet-4
  </option>

  <option value="claude-opus-4">
    claude-opus-4
  </option>

  {/* Gemini */}
  <option value="gemini-2.5-pro">
    gemini-2.5-pro
  </option>

  <option value="gemini-2.5-flash">
    gemini-2.5-flash
  </option>


  {/* xAI */}
  <option value="grok-3">
    grok-3
  </option>

  {/* DeepSeek */}
  <option value="deepseek-chat-v3">
    deepseek-chat-v3
  </option>

  {/* Meta */}
  <option value="llama-4-maverick">
    llama-4-maverick
  </option>

  {/* Qwen */}
  <option value="qwen-3-235b">
    qwen-3-235b
  </option>
</select>
      </div>

      {/* API KEY */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          API Key
        </label>

        <input
          type="password"
          placeholder="Enter API Key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="px-3 py-2 rounded-lg border text-xs font-medium"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)"
          }}
        />
      </div>
    </div>

    {/* Presets */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {PRESETS.map((p, i) => (
        <button
          key={i}
          onClick={() => setAgentQ(p)}
          className="text-left p-3 rounded-xl border transition-all text-xs leading-relaxed font-medium"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
            color: "var(--text-secondary)"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border-default)";
            e.currentTarget.style.backgroundColor = "var(--bg-card)";
          }}
        >
          {p}
        </button>
      ))}
    </div>

    {/* Input */}
    <div className="relative">
      <textarea
        className="input-base min-h-[100px] resize-none font-mono"
        placeholder="Ask your own question or select a preset above..."
        value={agentQ}
        onChange={(e) => setAgentQ(e.target.value)}
        rows={3}
      />
    </div>

    {/* Run button */}
    <button
      onClick={() => runAgent(model, apiKey)}
      disabled={
        running ||
        !agentQ.trim() ||
        !apiKey.trim()
      }
      className="btn-primary w-full py-3 text-sm"
    >
      {running ? (
        <>
          <RefreshCw
            size={18}
            className="animate-spin"
          />
          Processing...
        </>
      ) : (
        <>
          <Play
            size={18}
            fill="currentColor"
          />
          Launch AI Agent
        </>
      )}
    </button>

    {/* Output */}
    {aiOutput && (
      <div
        className="mt-6 p-5 rounded-lg border animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-scroll"
        style={{
          backgroundColor: "var(--primary-bg)",
          borderColor: "var(--primary)",
          borderStyle: "dashed"
        }}
      >
        <div className="space-y-4">

          <div>
            <h4
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Generated SQL
            </h4>

            <pre
              className="text-xs p-3 rounded-lg overflow-x-auto"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)"
              }}
            >
              {aiOutput.query}
            </pre>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Result ({aiOutput.rowCount})
            </h4>

            <pre
              className="text-xs p-3 rounded-lg overflow-x-auto"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)"
              }}
            >
              {JSON.stringify(aiOutput.rows, null, 2)}
            </pre>
          </div>

          {!aiOutput.success && (
            <p
              className="text-sm font-medium"
              style={{ color: "#ff4d4f" }}
            >
              {aiOutput.message}
            </p>
          )}
        </div>
      </div>
    )}
  </div>
</Card>

      {/* <Card title="Recently Resolved">
        <div className="space-y-3">
          {data.recentlyResolved.map((item, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)" }}
            >
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>
      </Card> */}

      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
          <div className="w-full max-w-lg rounded-xl border p-6 shadow-2xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {resolutionView === "manual" ? "Manual Resolution Guide" : 
                   resolutionView === "organizational" ? "Organizational Support" : 
                   "Choose Resolution Type"}
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {resolutionView ? (
                    <>Resolving: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{selectedRecommendation?.title}</span></>
                  ) : (
                    <>How do you want to resolve: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{selectedRecommendation?.title}</span></>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={closeResolveModal}
                className="flex h-8 w-8 items-center justify-center rounded border transition-colors"
                style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {!resolutionView && (
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setResolutionView("manual")}
                  className="rounded-lg border p-5 text-left transition-all"
                  style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>
                    <Wrench size={20} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Manual</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>Resolve this specific issue manually with step-by-step guidance.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionView("organizational")}
                  className="rounded-lg border p-5 text-left transition-all"
                  style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>
                    <Building2 size={20} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Organizational</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>Apply policy-level resolution and contact our support team.</p>
                </button>
              </div>
            )}

            {resolutionView === "manual" && (
              <div className="space-y-4">
                <div className="rounded-lg border p-5" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)" }}>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>1</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Target Database</p>
                        <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Active Database Instance</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>2</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Target Entity / Table</p>
                        <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {selectedRecommendation?.description?.match(/in ([^. ]+)/)?.[1] || 
                           selectedRecommendation?.description?.match(/for ([^. ]+)/)?.[1] || 
                           "Review context to identify target"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>3</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Action Required</p>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {selectedRecommendation?.description}
                        </p>
                      </div>
                    </div>

                    {selectedRecommendation?.sql && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>4</div>
                        <div className="w-full overflow-hidden">
                          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Recommended SQL Query</p>
                          <div className="relative group">
                            <pre 
                              className="w-full p-3 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto border"
                              style={{ 
                                backgroundColor: "var(--bg-card)", 
                                borderColor: "var(--border-default)",
                                color: "var(--text-primary)"
                              }}
                            >
                              <code>{selectedRecommendation.sql}</code>
                            </pre>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedRecommendation.sql);
                                alert("Query copied to clipboard!");
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="Copy to clipboard"
                            >
                              <Database size={12} />
                            </button>
                          </div>
                          <p className="mt-2 text-[10px] italic" style={{ color: "var(--text-muted)" }}>
                            Note: Replace placeholders like &lt;table_name&gt; with actual values.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setResolutionView(null)} className="btn-ghost">
                    Back
                  </button>
                  <button type="button" onClick={closeResolveModal} className="btn-primary">
                    Got it
                  </button>
                </div>
              </div>
            )}

            {resolutionView === "organizational" && (
              <div className="space-y-4">
                <div className="rounded-lg border p-6" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)" }}>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Company Website</p>
                        <a 
                          href="https://techknomatic.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-0.5 block text-sm font-bold hover:underline"
                          style={{ color: "var(--primary)" }}
                        >
                          https://techknomatic.com/
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>
                        <Database size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Address</p>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          3rd Floor, Signet Corner, Balewadi Phata, Baner, Pune, Maharashtra 411045
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-toggle)", color: "var(--text-primary)" }}>
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Contact Details</p>
                        <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>+91 98226 83356</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setResolutionView(null)} className="btn-ghost">
                    Back
                  </button>
                  <button type="button" onClick={closeResolveModal} className="btn-primary">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;
