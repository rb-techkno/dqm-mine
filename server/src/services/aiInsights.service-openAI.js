// aiInsights.service.js
import { callLLM } from "./aiClient-openAI.js";

function prepareAIInput(report) {
  const checks = report.checks || [];
  const issues = checks.filter(c => c.isIssue === true);

  // Grouping ensures the AI understands the scale of the issues
  const grouped = issues.reduce((acc, c) => {
    if (!acc[c.ruleName]) acc[c.ruleName] = { rule: c.ruleName, severity: c.severity, targets: [] };
    acc[c.ruleName].targets.push(c.target);
    return acc;
  }, {});

  return {
    engineHealthScore: report.healthScore,
    totalIssues: issues.length,
    groupedIssues: Object.values(grouped)
  };
}

function buildPrompt(aiInput) {
  return `Act as a Data Quality API.
  
STRICT REQUIREMENTS:
1. You MUST include "Primary Key Uniqueness" and "Duplicate Row Detection" in criticalIssues if present in data.
2. For "customers.name" and "customers.email", identify PII risks.
3. Use the engineHealthScore: ${aiInput.engineHealthScore}

DATA FROM ENGINE:
${JSON.stringify(aiInput)}

TARGET JSON FORMAT:
{
  "summary": "2-sentence overview of health.",
  "healthScore": ${aiInput.engineHealthScore},
  "criticalIssues": [
    { "issue": "string", "target": "string", "severity": "string", "impact": "string", "fix": "string" }
  ],
  "recommendations": ["Actionable step"]
}`;
}

export async function generateAIInsights(report) {
  const aiInput = prepareAIInput(report);
  const prompt = buildPrompt(aiInput);
  
  const raw = await callLLM(prompt);

  try {
    // OpenAI with response_format returns clean JSON, but we still parse it safely
    return JSON.parse(raw);
  } catch (err) {
    console.error("AI Parse Error:", err);
    return { summary: "Failed to generate insights.", healthScore: aiInput.engineHealthScore, criticalIssues: [], recommendations: [] };
  }
}