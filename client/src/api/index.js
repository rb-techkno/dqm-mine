const API_BASE = "/api";

export const getDashboardMetrics = async () => {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
  return res.json();
};

export const getAIInsights = async () => {
  const res = await fetch(`${API_BASE}/ai-insights`);
  if (!res.ok) throw new Error("Failed to fetch ai insights metrics");
  return res.json();
};

export const getQualityData = async () => {
  const res = await fetch(`${API_BASE}/quality-checks`);
  if (!res.ok) throw new Error("Failed to fetch quality data");
  return res.json();
};

export const getGovernanceData = async () => {
  const res = await fetch(`${API_BASE}/governance`);
  if (!res.ok) throw new Error("Failed to fetch governance data");
  return res.json();
};

export const getRecommendations = async () => {
  const res = await fetch(`${API_BASE}/recommendations`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
};

// export const queryAiAgent = async (question) => {
//   const res = await fetch(`${API_BASE}/ai-agent`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ question }),
//   });
//   if (!res.ok) throw new Error("Failed to get AI agent response");
//   const data = await res.json();
//   return data.response;
// };

export const queryAiAgent = async (question, model, apiKey) => {
  const res = await fetch(`${API_BASE}/ai-agent/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question , model, apiKey }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "AI Agent failed");
  }

  return data;
};

export const executeQuery = async (query) => {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Query execution failed");
  }
  return res.json();
};

export const getTables = async () => {
  const res = await fetch(`${API_BASE}/tables`);
  if (!res.ok) throw new Error("Failed to fetch tables");
  return res.json();
};

export const getColumns = async (table) => {
  const res = await fetch(`${API_BASE}/columns?table=${table}`);
  if (!res.ok) throw new Error(`Failed to fetch columns for table ${table}`);
  return res.json();
};

export const getBusinessRules = async () => {
  const res = await fetch(`${API_BASE}/business-rules`);
  if (!res.ok) throw new Error("Failed to fetch business rules");
  const json = await res.json();
  console.log(json.data);
  return json.data;
};

export const addBusinessRule = async (rule) => {
  const res = await fetch(`${API_BASE}/business-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error("Failed to add business rule");
  const json = await res.json();
  console.log(json);
  return json;
};

export const updateBusinessRule = async (id, rule) => {
  const res = await fetch(`${API_BASE}/business-rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error("Failed to update business rule");
  return res.json();
};

export const deleteBusinessRule = async (id) => {
  const res = await fetch(`${API_BASE}/business-rules/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete business rule");
  return true;
};
