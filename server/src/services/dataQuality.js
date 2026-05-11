// dataQuality.js
import { setTimeout as sleep } from "timers/promises";
import { dbService } from "./dbService.js";

// ─────────────────────────────────────────
// GEMINI CLIENT
// ─────────────────────────────────────────

async function callLLM(prompt, retries = 3, delay = 5000) {
  const apiKey = "AIzaSyCIXQC6hDwwpLD6Fwc_Ksy0w4PDwyRyAqk";
  const model = "gemini-2.5-flash-lite";

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await res.json();

      if (res.status === 503 || res.status === 429) {
        console.warn(`⚠️ Gemini busy. Retrying in ${delay / 1000}s... (${i + 1}/${retries})`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delay);
    }
  }
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const safeInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
const r2 = (v) => Math.round(v * 100) / 100;

async function queryOne(sql) {
  const result = await dbService.executeQuery(sql);
  if (result.ok && result.rows.length > 0) return result.rows[0];
  return null;
}

function guessKind(colName) {
  const c = colName.toLowerCase();
  if (/\b(id|count|num|qty|amount|price|salary|age|score|rank)\b/.test(c)) return "numeric";
  if (/\b(date|time|created|updated|_at|_on)\b/.test(c)) return "datetime";
  return "text";
}

// ─────────────────────────────────────────
// PER-COLUMN STATS
// ─────────────────────────────────────────

async function analyzeColumns(tableName, columns, rowCount) {
  const stats = {};
  const t = `"${tableName.replace(/"/g, "")}"`;

  for (const col of columns) {
    const q = `"${col}"`;
    const s = { nullCount: 0, nullRate: 0, distinctCount: 0, distinctRate: 0 };

    try {
      const row = await queryOne(`SELECT COUNT(*) AS n FROM ${t} WHERE ${q} IS NULL`);
      s.nullCount = safeInt(row?.n ?? row?.N ?? 0);
      s.nullRate = rowCount > 0 ? r2(s.nullCount / rowCount) : 0;
    } catch { /* skip */ }

    try {
      const row = await queryOne(`SELECT COUNT(DISTINCT ${q}) AS n FROM ${t}`);
      s.distinctCount = safeInt(row?.n ?? row?.N ?? 0);
      s.distinctRate = rowCount > 0 ? r2(s.distinctCount / rowCount) : 0;
    } catch { /* skip */ }

    const kind = guessKind(col);

    if (kind === "text") {
      try {
        const row = await queryOne(
          `SELECT MIN(LENGTH(${q})) AS mn, MAX(LENGTH(${q})) AS mx FROM ${t} WHERE ${q} IS NOT NULL`
        );
        if (row) {
          s.minLength = safeInt(row.mn ?? row.MN ?? 0);
          s.maxLength = safeInt(row.mx ?? row.MX ?? 0);
        }
      } catch { /* skip */ }
    }

    if (kind === "numeric" || kind === "datetime") {
      try {
        const row = await queryOne(
          `SELECT MIN(${q}) AS mn, MAX(${q}) AS mx FROM ${t} WHERE ${q} IS NOT NULL`
        );
        if (row) {
          s.min = row.mn ?? row.MN ?? null;
          s.max = row.mx ?? row.MX ?? null;
        }
      } catch { /* skip */ }
    }

    stats[col] = s;
  }

  return stats;
}

// ─────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────

function scoreTable(tableName, rowCount, columnStats) {
  const issues = [];
  let deductions = 0;

  if (rowCount === 0) {
    return { issues: ["Table is empty."], healthScore: 0 };
  }

  for (const [col, s] of Object.entries(columnStats)) {
    if (s.nullRate > 0.5) {
      issues.push(`"${col}" is ${Math.round(s.nullRate * 100)}% NULL.`);
      deductions += 15;
    } else if (s.nullRate > 0.2) {
      issues.push(`"${col}" has elevated NULLs (${Math.round(s.nullRate * 100)}%).`);
      deductions += 7;
    }

    if (s.distinctCount === 1 && rowCount > 1) {
      issues.push(`"${col}" has only one distinct value — possible constant or default.`);
      deductions += 5;
    }

    if (
      guessKind(col) === "numeric" &&
      col.toLowerCase().includes("id") &&
      s.distinctRate < 0.5 &&
      rowCount > 10
    ) {
      issues.push(
        `"${col}" looks like an ID but has low cardinality (${Math.round(s.distinctRate * 100)}% unique).`
      );
      deductions += 10;
    }
  }

  return { issues, healthScore: Math.max(0, Math.min(100, 100 - deductions)) };
}

// ─────────────────────────────────────────
// REPORT BUILDER
// ─────────────────────────────────────────

async function buildReport() {
  const tablesResult = await dbService.getTables();
  if (!tablesResult.ok) throw new Error(`Could not list tables: ${tablesResult.message}`);

  const tables = {};
  let totalScore = 0;

  for (const tableName of tablesResult.tables) {
    let rowCount = 0;
    try {
      const t = `"${tableName.replace(/"/g, "")}"`;
      const row = await queryOne(`SELECT COUNT(*) AS n FROM ${t}`);
      rowCount = safeInt(row?.n ?? row?.N ?? 0);
    } catch { /* leave 0 */ }

    const colsResult = await dbService.getColumns(tableName);
    const columns = colsResult.ok ? colsResult.columns : [];

    const columnStats = await analyzeColumns(tableName, columns, rowCount);
    const { issues, healthScore } = scoreTable(tableName, rowCount, columnStats);

    tables[tableName] = { rowCount, columnCount: columns.length, healthScore, columns: columnStats, issues };
    totalScore += healthScore;
  }

  const tableNames = tablesResult.tables;
  const healthScore = tableNames.length > 0 ? r2(totalScore / tableNames.length) : 100;

  return { tables, healthScore, tableCount: tableNames.length };
}

// ─────────────────────────────────────────
// AI PROMPT
// ─────────────────────────────────────────

function buildPrompt(report) {
  const lines = [
    `Overall database health score: ${report.healthScore}/100`,
    `Total tables analysed: ${report.tableCount}`,
    "",
  ];

  for (const [table, t] of Object.entries(report.tables)) {
    lines.push(`Table: ${table}`);
    lines.push(`  Rows: ${t.rowCount} | Columns: ${t.columnCount} | Score: ${t.healthScore}/100`);

    if (t.issues.length) {
      lines.push("  Issues:");
      t.issues.forEach((i) => lines.push(`    - ${i}`));
    }

    const highNull = Object.entries(t.columns)
      .filter(([, s]) => s.nullRate > 0)
      .sort(([, a], [, b]) => b.nullRate - a.nullRate)
      .slice(0, 3);

    if (highNull.length) {
      lines.push("  Top NULL columns:");
      highNull.forEach(([col, s]) => lines.push(`    ${col}: ${Math.round(s.nullRate * 100)}%`));
    }

    lines.push("");
  }

  return `You are a senior data engineer reviewing a database health report.
Write a concise plain-English analysis (3-5 short paragraphs).
Cover: overall quality, the most critical problems, which tables need immediate attention, and 2-3 actionable recommendations.
Do not list every number — focus on meaning and priority.

Report:
${lines.join("\n")}`;
}

// ─────────────────────────────────────────
// MAIN EXPORT  ← the only thing you need to call
// ─────────────────────────────────────────

/**
 * Run data quality analysis on every table and return the full report + AI insights.
 *
 * Usage anywhere in your project:
 *
 *   import { getDataQualityReport } from "./dataQuality.js";
 *
 *   const result = await getDataQualityReport();
 *   return {
 *     ...result,
 *     healthScore: result.healthScore,
 *     insights: result.insights,
 *   };
 *
 * Response shape:
 *   {
 *     healthScore: number,          // 0-100 average across all tables
 *     tableCount: number,
 *     insights: string,             // Gemini narrative
 *     tables: {
 *       [tableName]: {
 *         rowCount: number,
 *         columnCount: number,
 *         healthScore: number,
 *         issues: string[],
 *         columns: {
 *           [colName]: {
 *             nullCount, nullRate, distinctCount, distinctRate,
 *             minLength?, maxLength?,   // text columns
 *             min?, max?,               // numeric / datetime columns
 *           }
 *         }
 *       }
 *     }
 *   }
 */
export async function getDataQualityReport() {
  const report = await buildReport();

  async function generateAIInsights() {
    const prompt = buildPrompt(report);
    return await callLLM(prompt);
  }

  const aiText = await generateAIInsights();

  return {
    ...report,
    healthScore: report.healthScore,
    insights: aiText,
  };
}
