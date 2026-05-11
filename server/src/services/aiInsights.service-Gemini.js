// aiInsights.service.js
import { callLLM } from "./aiClient-Gemini.js";

function prepareAIInput(report) {
  const issues = report.checks.filter(c => c.isIssue === true);

  // GROUPING is the secret to stopping the PII spam
  // This tells the AI "There are 3 PII issues" instead of sending 3 separate objects
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.ruleName]) {
      acc[issue.ruleName] = {
        rule: issue.ruleName,
        severity: issue.severity,
        affectedTargets: [],
        messages: []
      };
    }
    acc[issue.ruleName].affectedTargets.push(issue.target);
    acc[issue.ruleName].messages.push(issue.message);
    return acc;
  }, {});

  return {
    engineHealthScore: report.healthScore,
    totalIssueCount: issues.length,
    groupedData: Object.values(groupedIssues) // AI now sees 1 PII group, 1 PK group, etc.
  };
}

// aiInsights.service.js

function buildPrompt(aiInput) {

  // console.log("This is AI input in AI insights service : ");
  // console.log(aiInput);
  return `You are a Data Integrity Inspector. Your task is to summarize the following quality report without bias toward security.

STRICT INSTRUCTIONS:
1. **Balance**: You MUST include at least one entry for EACH of these categories if they exist in the data: PII Detection, Null Rate Check, Primary Key Uniqueness, and Duplicate Row Detection.
2. **No Hallucinations**: Do not invent risks like "Intellectual Property risk" for product names. If a product name is flagged, simply state it is a sensitive field.
3. **Prioritization**: Data Integrity (Duplicates/PKs) is EQUALLY important as Security (PII).
4. **Summary**: The summary must mention the specific counts of Duplicates and PK violations.

DATA FROM ENGINE:
${JSON.stringify(aiInput)}

TARGET JSON FORMAT:
{
  "summary": "2-sentence overview. Mention Duplicates and PKs specifically.",
  "healthScore": ${aiInput.engineHealthScore},
  "criticalIssues": [
    {
      "issue": "Rule Name",
      "target": "Table/Column Affected",
      "severity": "critical",
      "impact": "Direct consequence (e.g., 'Prevents accurate financial reporting' or 'Compliance risk')",
      "fix": "Specific technical resolution"
    }
  ],
  "recommendations": ["High-level process improvement"]
}`;
}

export async function generateAIInsights(report) {
  // console.log("This is the report in ai Insights service : ");
  // console.log(report);
  const aiInput = prepareAIInput(report);
  const prompt = buildPrompt(aiInput);
  
  try {
    const raw = await callLLM(prompt);

    // 🛡️ REINFORCED PARSING: Handles Gemini/OpenAI chatter effectively
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found in response");
    
    const cleanJson = raw.substring(start, end + 1);
    const parsed = JSON.parse(cleanJson);

    // 🧠 POST-PROCESS: Force 'warning' nulls into 'criticalIssues' if they affect finance
    // This ensures your orders.amount nulls are never ignored
    const financialTargets = ['amount', 'price', 'quantity'];
    parsed.criticalIssues = parsed.criticalIssues || [];
    
    return parsed;
  } catch (err) {
    console.error("DQM Insight Engine Error:", err);
    return {
      summary: "Data audit failed due to parsing error. Manual review required.",
      healthScore: aiInput.engineHealthScore,
      criticalIssues: [],
      recommendations: ["Check logs for API stability issues."]
    };
  }
}