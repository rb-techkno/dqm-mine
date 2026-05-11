// aiInsights.service.js
import { callLLM } from "./aiClient-Gemini.js";
import { dbService } from "./dbService.js";

// ─────────────────────────────────────────
// LIVE DB ANALYSIS
// ─────────────────────────────────────────

const safeInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };

async function queryOne(sql) {
  const result = await dbService.executeQuery(sql);
  if (result.ok && result.rows.length > 0) return result.rows[0];
  return null;
}

async function analyzeTable(tableName) {
  const issues = [];
  const t = `"${tableName.replace(/"/g, "")}"`;

  // Row count
  let rowCount = 0;
  try {
    const row = await queryOne(`SELECT COUNT(*) AS n FROM ${t}`);
    rowCount = safeInt(row?.n ?? row?.N ?? 0);
  } catch { /* skip */ }

  if (rowCount === 0) {
    issues.push({ ruleName: "Empty Table", target: tableName, severity: "warn", message: "Table has no rows." });
    return { rowCount, issues };
  }

  // Column list
  const colsResult = await dbService.getColumns(tableName);
  const columns = colsResult.ok ? colsResult.columns.filter(c => typeof c === "string") : [];

  for (const col of columns) {
    const q = `"${col}"`;

    // NULL rate check
    try {
      const row = await queryOne(`SELECT COUNT(*) AS n FROM ${t} WHERE ${q} IS NULL`);
      const nullCount = safeInt(row?.n ?? row?.N ?? 0);
      const nullRate = nullCount / rowCount;
      if (nullRate > 0.5) {
        issues.push({
          ruleName: "Null Rate Check",
          target: `${tableName}.${col}`,
          severity: "crit",
          message: `${Math.round(nullRate * 100)}% of values are NULL.`,
        });
      } else if (nullRate > 0.2) {
        issues.push({
          ruleName: "Null Rate Check",
          target: `${tableName}.${col}`,
          severity: "warn",
          message: `${Math.round(nullRate * 100)}% of values are NULL.`,
        });
      }
    } catch { /* skip */ }

    // Primary Key Uniqueness — columns named "id" or ending in "_id"
    const colLower = col.toLowerCase();
    if (colLower === "id" || colLower.endsWith("_id")) {
      try {
        const row = await queryOne(
          `SELECT COUNT(*) AS total, COUNT(DISTINCT ${q}) AS uniq FROM ${t} WHERE ${q} IS NOT NULL`
        );
        const total = safeInt(row?.total ?? row?.TOTAL ?? 0);
        const uniq  = safeInt(row?.uniq  ?? row?.UNIQ  ?? 0);
        if (total > 0 && uniq < total) {
          issues.push({
            ruleName: "Primary Key Uniqueness",
            target: `${tableName}.${col}`,
            severity: "crit",
            message: `${total - uniq} duplicate value(s) found in ID column.`,
          });
        }
      } catch { /* skip */ }
    }

    // PII Detection — columns whose names suggest personal data
    const piiPattern = /\b(email|phone|mobile|ssn|passport|dob|birth|address|zip|postcode|credit_card|card_number|cvv|iban|national_id)\b/i;
    if (piiPattern.test(col)) {
      issues.push({
        ruleName: "PII Detection",
        target: `${tableName}.${col}`,
        severity: "warn",
        message: `Column name suggests it may contain PII data.`,
      });
    }
  }

  // Duplicate Row Detection
  try {
    const row = await queryOne(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT ${
        columns.slice(0, 5).map(c => `"${c}"`).join(" || '-' || ")
      }) AS uniq FROM ${t}`
    );
    const total = safeInt(row?.total ?? row?.TOTAL ?? 0);
    const uniq  = safeInt(row?.uniq  ?? row?.UNIQ  ?? 0);
    if (total > 0 && uniq < total) {
      issues.push({
        ruleName: "Duplicate Row Detection",
        target: tableName,
        severity: "err",
        message: `${total - uniq} potential duplicate row(s) detected (based on first 5 columns).`,
      });
    }
  } catch { /* skip */ }

  return { rowCount, issues };
}

// ─────────────────────────────────────────
// PREPARE AI INPUT  (replaces the old report-based version)
// ─────────────────────────────────────────

async function prepareAIInput() {
  const tablesResult = await dbService.getTables();
  if (!tablesResult.ok) throw new Error(`Could not list tables: ${tablesResult.message}`);

  const allIssues = [];
  let totalScore = 0;
  const tableCount = tablesResult.tables.length;

  for (const tableName of tablesResult.tables) {
    const { rowCount, issues } = await analyzeTable(tableName);
    allIssues.push(...issues.map(i => ({ ...i, isIssue: true })));

    // Score: start at 100, deduct per issue severity
    let deductions = 0;
    for (const i of issues) {
      if (i.severity === "crit") deductions += 15;
      else if (i.severity === "err") deductions += 10;
      else deductions += 5;
    }
    totalScore += Math.max(0, 100 - deductions);
  }

  const healthScore = tableCount > 0 ? Math.round(totalScore / tableCount) : 100;

  // Same grouping logic as your original
  const summaryByCategory = allIssues.reduce((acc, c) => {
    if (!acc[c.ruleName]) acc[c.ruleName] = { count: 0, samples: [] };
    acc[c.ruleName].count++;
    if (acc[c.ruleName].samples.length < 3) acc[c.ruleName].samples.push(c.target);
    return acc;
  }, {});

  return {
    engineHealthScore: healthScore,
    totalIssues: allIssues.length,
    issueSummary: summaryByCategory,
    rawIssues: allIssues.map(c => ({
      rule: c.ruleName,
      target: c.target,
      severity: c.severity,
      message: c.message,
    })),
  };
}

// ─────────────────────────────────────────
// PROMPT  (unchanged from your original)
// ─────────────────────────────────────────

function buildPrompt(aiInput) {
  return `You are a Data Quality API. Respond ONLY with valid JSON. No conversational text.

STRICT INSTRUCTIONS:
1. You MUST include these 4 categories in "criticalIssues" if they are in the data:
   - PII Detection
   - Duplicate Row Detection
   - Primary Key Uniqueness
   - Null Rate Check
2. Use "engineHealthScore" exactly: ${aiInput.engineHealthScore}

DATA:
${JSON.stringify(aiInput)}

TARGET JSON FORMAT:
{
  "summary": "2-sentence overview.",
  "healthScore": ${aiInput.engineHealthScore}, 
  "criticalIssues": [
    { "issue": "name", "target": "table/col", "severity": "crit/err/warn", "impact": "risk", "fix": "solution" }
  ],
  "recommendations": []
}

OUTPUT JSON:
{`;
}

// ─────────────────────────────────────────
// MAIN EXPORT  (same signature as your original)
// ─────────────────────────────────────────

/**
 * Analyses the currently active dbService connection and returns AI insights.
 *
 * Usage (identical to before, just no report argument needed):
 *
 *   const aiText = await generateAIInsights();
 *   return {
 *     ...report,
 *     healthScore: report.healthScore,
 *     insights: aiText,
 *   };
 */
export async function generateAIInsights() {
  const aiInput = await prepareAIInput();
  const prompt = buildPrompt(aiInput);
  const raw = await callLLM(prompt);

  try {
    const jsonContent =
      raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1) || "{" + raw;
    return JSON.parse(jsonContent);
  } catch (err) {
    console.error("AI Parse Error. Raw was:", raw);
    return {
      summary: "Error parsing AI response.",
      healthScore: aiInput.engineHealthScore,
      criticalIssues: [],
      recommendations: [],
    };
  }
}
