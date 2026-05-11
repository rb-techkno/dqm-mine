import { setTimeout as sleep } from "timers/promises";
import { dbService } from "./dbService.js";

// -----------------------------
// 🧠 Schema Cache
// -----------------------------
let cachedSchema = null;

async function getSchema() {
  if (cachedSchema) return cachedSchema;

  const tablesRes = await dbService.getTables();
  if (!tablesRes.ok) return [];

  const schema = [];
  for (const table of tablesRes.tables) {
    const colRes = await dbService.getColumns(table);
    schema.push({ table, columns: colRes.ok ? colRes.columns : [] });
  }

  // limit for small models
  cachedSchema = schema.slice(0, 8).map(t => ({
    table: t.table,
    columns: t.columns.slice(0, 6)
  }));

  return cachedSchema;
}

// -----------------------------
// 📞 Universal LLM Caller
// -----------------------------
export async function callLLM(prompt, modelName, apiKey, temperature = 0.2) {
  const isGemini = modelName && modelName.toLowerCase().includes("gemini");
  const isGroq = modelName && modelName.toLowerCase() === "groq";

  console.log(modelName);
  console.log(isGemini);

  if (isGemini) {
    const finalApiKey = apiKey || "AIzaSyC6dWWRD7r6wZVJ3nB4ueSpEb382JJrtOg";
    const model = modelName || "gemini-2.5-flash-lite";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${finalApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  }

  if (isGroq) {
    const finalApiKey = apiKey || process.env.GROQ_API_KEY;
    if (!finalApiKey) throw new Error("Missing GROQ_API_KEY");
    const model = "llama-3.1-8b-instant"; // Groq default
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalApiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  const lowerModel = (modelName || "").toLowerCase();

  // OpenAI Natively
  if (lowerModel.startsWith("gpt-")) {
    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!finalApiKey) throw new Error("Missing OPENAI_API_KEY");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalApiKey}` },
      body: JSON.stringify({ model: lowerModel, messages: [{ role: "user", content: prompt }], temperature })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  // Anthropic Natively
  if (lowerModel.startsWith("claude-")) {
    const finalApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!finalApiKey) throw new Error("Missing ANTHROPIC_API_KEY");
    const modelMap = {
      "claude-sonnet-4": "claude-3-5-sonnet-20240620",
      "claude-opus-4": "claude-3-opus-20240229"
    };
    const mappedModel = modelMap[lowerModel] || "claude-3-5-sonnet-20240620";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-api-key": finalApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ 
        model: mappedModel, 
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }], 
        temperature 
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  }

  // xAI Natively
  if (lowerModel.startsWith("grok-")) {
    const finalApiKey = apiKey || process.env.XAI_API_KEY;
    if (!finalApiKey) throw new Error("Missing XAI_API_KEY");
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalApiKey}` },
      body: JSON.stringify({ model: lowerModel, messages: [{ role: "user", content: prompt }], temperature })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  // DeepSeek Natively
  if (lowerModel.startsWith("deepseek-")) {
    const finalApiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    if (!finalApiKey) throw new Error("Missing DEEPSEEK_API_KEY");
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalApiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  // Llama natively (via Groq since Meta doesn't host public inference APIs)
  if (lowerModel.startsWith("llama-")) {
    const finalApiKey = apiKey || process.env.GROQ_API_KEY;
    if (!finalApiKey) throw new Error("Missing GROQ_API_KEY for Llama routing");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalApiKey}` },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: prompt }], temperature })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  // Default Fallback (OpenRouter)
  const finalApiKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!finalApiKey) throw new Error("Missing OPENROUTER_API_KEY");
  // const model = (modelName && modelName !== "openrouter") ? "openai/gpt-4o-mini" : "openai/gpt-4o-mini";
  const model = "openai/gpt-4o-mini";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${finalApiKey}`,
      "HTTP-Referer": "http://localhost",
      "X-Title": "AI SQL Agent",
    },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] ,max_tokens: 500, temperature })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

// -----------------------------
// 🧹 Content Extraction
// -----------------------------
function extractSQL(text, isMongo = false) {
  if (!text) throw new Error("Empty AI response");

  if (isMongo) {
    try {
      JSON.parse(text);
      return text.trim(); // Valid pure JSON
    } catch (e) {}

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    return text.trim();
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed.query) return parsed.query;
  } catch (e) { }

  const match = text.match(/```sql\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
  if (match) return match[1].trim();

  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const p = JSON.parse(jsonMatch[1]);
      if (p.query) return p.query;
    } catch (e) { }
  }

  return text.trim();
}

// -----------------------------
// 🚀 Generate SQL
// -----------------------------
export async function generateSQL(userQuestion, lastError = "", model, apiKey) {
  const schema = await getSchema();
  const { dbType } = dbService.activeConnection || {};
  const isMongo = dbType === "mongodb" || dbType === "mongo";

  const prompt = `
You are an expert database query generator.

DATABASE TYPE: ${dbType}

SCHEMA:
${JSON.stringify(schema, null, 2)}

RULES:
- Use ONLY tables/collections/columns from schema
- Do NOT invent names
- Prefer simple queries
- No explanations
- ${isMongo ?
      'Output ONLY a valid MongoDB Database Command JSON object (e.g. { "find": "users", "filter": { "age": 20 } } or { "aggregate": "users", "pipeline": [...] })' :
      'Output ONLY a valid SQL query'}

USER QUESTION:
${userQuestion}

${lastError ? `PREVIOUS ERROR:\n${lastError}\nFix the query.` : ""}
`;

  const rawAnswer = await callLLM(prompt, model, apiKey, 0.2);
  return extractSQL(rawAnswer, isMongo);
}

// -----------------------------
// 🧠 Summarize Final Answer
// -----------------------------
export async function generateFinalAnswer(question, sql, rows, model, apiKey) {
  const prompt = `
You are a senior data analyst.

You will be given:
1. User question
2. SQL query used
3. Query result rows

TASK:
- Understand the data
- Answer the user directly
- Do NOT output SQL
- Do NOT output JSON
- Be concise but accurate
- If data is empty, just say "No data found".

USER QUESTION:
${question}

SQL USED:
${sql}

RESULT DATA:
${JSON.stringify(rows)}

FINAL ANSWER:
`;

  return await callLLM(prompt, model, apiKey, 0.3);
}