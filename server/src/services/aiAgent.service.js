import { generateSQL, generateFinalAnswer } from "./aiClient.js";
import { dbService } from "./dbService.js";

// -----------------------------
// 🔒 Safety
// -----------------------------
function isSafeQuery(sql) {
  const forbidden = ["drop", "delete", "truncate", "update", "insert", "alter"];
  return !forbidden.some(k => sql.toLowerCase().includes(k));
}

// -----------------------------
// 🔧 Auto Fix
// -----------------------------
function autoFixSQL(sql) {
  return sql
    .replace(/\bSELECT\s+table\b/gi, "SELECT table_name")
    .replace(/;;+/g, ";");
}

// -----------------------------
// 🗄️ Execute
// -----------------------------
async function runQuery(sql) {
  const { dbType, client } = dbService.activeConnection || {};
  if (!client) throw new Error("Database not connected");

  switch (dbType) {
    case "postgres":
      return (await client.query(sql)).rows || [];
    case "mysql":
      return (await client.execute(sql))[0] || [];
    case "sqlite":
      return new Promise((res, rej) => client.all(sql, [], (e, r) => (e ? rej(e) : res(r || []))));
    case "sqlserver":
      return (await client.request().query(sql)).recordset || [];
    case "snowflake":
      return new Promise((res, rej) => client.execute({ sqlText: sql, complete: (e, s, r) => (e ? rej(e) : res(r || [])) }));
    case "oracle":
      const oracledb = await import("oracledb");
      return (await client.execute(sql, [], { outFormat: oracledb.default.OUT_FORMAT_OBJECT })).rows || [];
    case "mongodb":
    case "mongo":
      const cmd = JSON.parse(sql);
      const resData = await client.db.command(cmd);
      return resData.cursor?.firstBatch || [resData];
    default:
      throw new Error(`Unsupported DB type: ${dbType}`);
  }
}

// -----------------------------
// 🚀 MAIN AGENT
// -----------------------------
export async function runAIAgent(userQuestion, model, apiKey) {
  let lastError = "";

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`🚀 Attempt ${attempt} (Model: ${model || 'default'})`);

    try {
      let rawSql = await generateSQL(userQuestion, lastError, model, apiKey);
      let sql = autoFixSQL(rawSql).trim();

      if (!isSafeQuery(sql)) {
        throw new Error("Unsafe query blocked");
      }

      console.log("🧠 SQL:", sql);

      const rows = await runQuery(sql);

      // Generate a user-friendly summary
      const answer = await generateFinalAnswer(userQuestion, sql, rows, model, apiKey);

      return {
        success: true,
        answer,
        query: sql,
        rows,
      };

    } catch (err) {
      console.log("❌ Error:", err.message);

      lastError = err.message;

      if (attempt === 3) {
        return {
          success: false,
          error: "Failed after 3 attempts: " + err.message,
        };
      }
    }
  }
}