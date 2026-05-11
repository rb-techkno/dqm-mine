import { runQualityChecks, getQualitySummary } from "./qualityEngine.js";
import { dbService } from "./dbService.js";

const recommendationByRule = {
  "PII Detection": (target) => ({
    title: "Encrypt Sensitive Columns",
    description: `The ${target} column contains PII. Encrypt or mask this data and enforce a key management policy.`,
    impact: "High",
    category: "Security",
    action: "Apply Encryption",
    sql: `/* Mask PII data in ${target} */\nUPDATE <table_name>\nSET ${target} = '********'\nWHERE ${target} IS NOT NULL;`
  }),
  "Null Rate Check": (target) => ({
    title: "Reduce Null Values",
    description: `The ${target} column has a high null rate. Consider adding input validation and default handling.`,
    impact: "Medium",
    category: "Quality",
    action: "Enforce Constraint",
    sql: `/* Set default value for nulls in ${target} */\nUPDATE <table_name>\nSET ${target} = 'DEFAULT_VALUE'\nWHERE ${target} IS NULL;`
  }),
  "Primary Key Uniqueness": (target) => ({
    title: "Repair Duplicate Keys",
    description: `Uniqueness violations found in ${target}. Add uniqueness constraints and deduplicate records.`,
    impact: "High",
    category: "Quality",
    action: "Add Constraint",
    sql: `/* Identify and delete duplicates in ${target} */\nDELETE FROM <table_name>\nWHERE id NOT IN (\n  SELECT MIN(id)\n  FROM <table_name>\n  GROUP BY ${target}\n);`
  }),
  "Referential Integrity": (target) => ({
    title: "Fix Referential Integrity",
    description: `Broken foreign keys detected in ${target}. Repair constraints and reconcile orphan references.`,
    impact: "High",
    category: "Quality",
    action: "Repair FK",
    sql: `/* Delete orphans in ${target} */\nDELETE FROM <table_name>\nWHERE ${target} NOT IN (\n  SELECT id FROM <parent_table>\n);`
  }),
  "Volume Anomaly": (target) => ({
    title: "Investigate Row Volume",
    description: `Significant volume anomaly detected in ${target}. Check the ingestion pipeline for data loss.`,
    impact: "Medium",
    category: "Performance",
    action: "Review Pipeline",
    sql: `/* Count rows for ${target} analysis */\nSELECT COUNT(*) FROM <table_name>;`
  }),
  "Timeliness Check": (target) => ({
    title: "Improve Data Freshness",
    description: `Ingestion delay detected for ${target}. Improve pipeline scheduling to reduce latency.`,
    impact: "Low",
    category: "Performance",
    action: "Optimize Schedule",
    sql: `/* Check last update time for ${target} */\nSELECT MAX(updated_at) FROM <table_name>;`
  }),
};

// export const getRecommendations = async () => {
//   const result = await runQualityChecks();
//   // console.log(result);
//   console.log("Inside get recommendations")
//   const checks = result.checks || [];
//   const actionable = checks.filter((check) => check.severity !== "info");

//   const recommendations = actionable.map((check) => {
//     const builder = recommendationByRule[check.ruleName];
//     return builder 
//       ? builder(check.target) 
//       : {
//           title: `Review ${check.ruleName}`,
//           description: `Analyze finding on ${check.target} and take corrective action.`,
//           impact: "Medium",
//           category: "Quality",
//           action: "Analyze",
//         };
//   });

//   // Fallback if no issues found
//   if (recommendations.length === 0) {
//     recommendations.push({
//       title: "Maintain Monitoring",
//       description: "No immediate quality or security violations found. Continue regular monitoring.",
//       impact: "Low",
//       category: "Performance",
//       action: "Stay Tuned",
//     });
//   }

//   // Generate dynamic recentlyResolved based on connection and passed checks
//   const recentlyResolved = [];
//   const tablesResult = await dbService.getTables();
  
//   if (tablesResult.ok && !tablesResult.mock) {
//     const table = tablesResult.tables[0];
//     recentlyResolved.push(`Verified referential integrity for '${table}' relations.`);
//     recentlyResolved.push(`Successfully updated schema classification for ${tablesResult.tables.length} tables.`);
//     recentlyResolved.push(`Optimized index coverage for recently added data in '${table}'.`);
//   } else {
//     recentlyResolved.push("Added NOT NULL constraint to 'users.username'");
//     recentlyResolved.push("Removed 428 duplicate records from 'audit_logs'");
//     recentlyResolved.push("Classified 14 PII columns in 'customers' table");
//   }

//   return {
//     recommendations: recommendations.slice(0, 6), // Limit to top 6
//     recentlyResolved,
//   };
// };

export const getRecommendations = async () => {
  const result = await runQualityChecks();
  
  // FIX: Accessing result directly (not result.data)
  const checks = result.checks || [];
  const aiInsights = result.insights || { recommendations: [] };

  // 1. Get Hardcoded Recommendations
  const manualRecs = checks
    .filter((check) => check.severity !== "info")
    .map((check) => {
      const builder = recommendationByRule[check.ruleName];
      return builder ? builder(check.target) : null;
    })
    .filter(Boolean);

  // 2. Get AI Recommendations
  const aiRecs = (aiInsights.recommendations || []).map(text => ({
    title: "AI Suggestion",
    description: text,
    impact: "Medium",
    category: "AI Insight",
    action: "Review"
  }));

  // Combine and limit
  const finalRecommendations = [...manualRecs, ...aiRecs].slice(0, 6);

  if (finalRecommendations.length === 0) {
    finalRecommendations.push({
      title: "Monitoring Active",
      description: "No immediate violations found.",
      impact: "Low",
      category: "System",
      action: "Stay Tuned"
    });
  }

  return {
    recommendations: finalRecommendations,
    summary: aiInsights.summary || "No automated summary available.",
    healthScore: aiInsights.healthScore || 100
  };
};

export const queryAiAgent = async (question) => {
  const tablesResult = await dbService.getTables();
  const analysis = await getQualitySummary();
  const lowerQ = (question || "").toLowerCase();

  let response = `AI Agent Analysis for your question: "${question}"\n\n`;

  if (tablesResult.mock || !tablesResult.ok) {
    response += "⚠️ No active database connection. Analysis is based on mock data patterns.\n\n";
  } else {
    response += `✅ Connected to ${dbService.activeConnection.dbType}. Found ${tablesResult.tables.length} monitored tables.\n\n`;
  }

  if (lowerQ.includes("primary key") || lowerQ.includes("missing pk") || lowerQ.includes("uniqueness")) {
    const pkIssues = analysis.checks.filter(c => c.ruleName.includes("Primary Key") || c.ruleName.includes("Uniqueness"));
    if (pkIssues.length > 0) {
      response += `Analysis of ${tablesResult.tables.length} tables found uniqueness violations:\n`;
      pkIssues.forEach((c, i) => {
        response += `${i + 1}. ${c.target}: ${c.message}\n`;
      });
      response += `\nBusiness Risk: Duplicate keys prevent unique identification and row-level operations.\n`;
    } else {
      response += `Scan of ${tablesResult.tables.length} tables verified all primary keys are unique and healthy.\n`;
    }
  } else if (lowerQ.includes("null") || lowerQ.includes("missing data")) {
    const nullIssues = analysis.checks.filter(c => c.ruleName.includes("Null Rate"));
    if (nullIssues.length > 0) {
      response += `Found high null rates in monitored columns:\n`;
      nullIssues.forEach((c, i) => {
        response += `${i + 1}. ${c.target}: ${c.message}\n`;
      });
    } else {
      response += "Data completeness is optimal across all monitored columns (null rates < 10%).\n";
    }
  } else if (lowerQ.includes("pii") || lowerQ.includes("security") || lowerQ.includes("cross-domain")) {
    const piiIssues = analysis.checks.filter(c => c.ruleName.includes("PII") || c.ruleName.includes("Governance"));
    if (piiIssues.length > 0) {
      response += `Security scan detected sensitive information in unmasked columns:\n`;
      piiIssues.forEach((c, i) => {
        response += `${i + 1}. ${c.target}: ${c.message}\n`;
      });
      response += `\nRecommendation: Apply encryption or data masking policies.`;
    } else {
      response += "No unmasked PII or cross-domain security risks detected in recent scans.\n";
    }
  } else if (lowerQ.includes("most tables") || lowerQ.includes("schemas")) {
    response += `Database Schema Analysis:\n\n`;
    if (tablesResult.ok && !tablesResult.mock) {
      response += `- Found ${tablesResult.tables.length} tables in the ${dbService.activeConnection.database || 'public'} schema.\n`;
      response += `- Active Tables: ${tablesResult.tables.slice(0, 5).join(", ")}${tablesResult.tables.length > 5 ? '...' : ''}\n`;
    } else {
      response += `- public: 42 tables (Core transactional data)\n`;
      response += `- staging: 28 tables (Raw ingestion and transformation)\n`;
    }
  } else {
    response += `Analysis of your current ${dbService.activeConnection?.dbType || 'mock'} database shows an overall quality score of ${analysis.overallScore}%.\n\n`;
    response += `Top 3 areas for improvement:\n`;
    analysis.checks.filter(c => c.severity !== 'info').slice(0, 3).forEach((c, i) => {
      response += `${i + 1}. ${c.ruleName} on ${c.target}: ${c.message}\n`;
    });
  }

  return response;
};
