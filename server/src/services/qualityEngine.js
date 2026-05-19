import { getBusinessRules } from "../routes/business-rules.routes.js";
import { dbService } from "./dbService.js";
// import { businessRules } from "../routes/business-rules.routes.js";
import { generateAIInsights } from "./aiInsights.service-Gemini.js";
// import { generateAIInsights } from "./aiInsights.service-openAI.js";
// import { generateAIInsights } from "./aiInsights.service.js";

const severityOrder = {
  critical: 4,
  error: 3,
  warning: 2,
  info: 1,
};


const RULES = [

  // ------------------------------
  // CORE DATA QUALITY RULES
  // ------------------------------

  {
    name: "Null Rate Check",
    type: "column",
    regulation: ["GDPR", "HIPAA"],
    weight: 10,
    check: (col, metrics) => {
      if (metrics.nullRate === undefined) return null;
      const isIssue = metrics.nullRate > 0.1;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Null rate is ${(metrics.nullRate * 100).toFixed(1)}%.`,
        isIssue
      };
    }
  },

{
    name: "Primary Key Uniqueness",
    type: "column",
    weight: 20,
    check: (col, metrics) => {
      // 🌟 FIX: Use the actual metadata flag from the DB
      if (!metrics.isPrimaryKey) return null; 
      
      if (metrics.uniqueRate === undefined) return null;
      const isIssue = metrics.uniqueRate < 1;
      return {
        severity: isIssue ? "error" : "info",
        message: `Uniqueness is ${(metrics.uniqueRate * 100).toFixed(2)}%.`,
        isIssue
      };
    }
  },,

  {
    name: "Referential Integrity",
    type: "column",
    weight: 15,
    check: (col, metrics) => {
      if (metrics.fkCoverage === undefined) return null;
      const isIssue = metrics.fkCoverage < 0.98;
      return {
        severity: isIssue ? "critical" : "info",
        message: `FK coverage is ${(metrics.fkCoverage * 100).toFixed(1)}%.`,
        isIssue
      };
    }
  },

  {
    name: "PII Detection",
    type: "column",
    regulation: ["GDPR", "HIPAA", "PDPL"],
    weight: 25,
    check: (col, metrics) => {
      if (!metrics.pii) return null;
      return {
        severity: "critical",
        message: "Sensitive field detected. Encryption/masking required.",
        isIssue: true
      };
    }
  },

  {
    name: "Domain Value Check",
    type: "column",
    weight: 15,
    check: (col, metrics) => {
      if (!metrics.allowedValues || !metrics.invalidValues) return null;
      const isIssue = metrics.invalidValues.length > 0;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Invalid domain values found.`,
        isIssue
      };
    }
  },

  {
    name: "Data Type Validation",
    type: "column",
    weight: 25,
    check: (col, metrics) => {
      if (!metrics.dataType || !metrics.expectedType) return null;
      const isIssue = metrics.dataType !== metrics.expectedType;
      return {
        severity: isIssue ? "error" : "info",
        message: isIssue
          ? `Type mismatch: Expected ${metrics.expectedType}, found ${metrics.dataType}.`
          : `Type verified.`,
        isIssue
      };
    }
  },

  {
    name: "Format Validation",
    type: "column",
    weight: 10,
    check: (col, metrics) => {
      if (metrics.formatValid === undefined) return null;
      const isIssue = !metrics.formatValid;
      return {
        severity: isIssue ? "warning" : "info",
        message: isIssue ? `Invalid format.` : `Format valid.`,
        isIssue
      };
    }
  },

  {
    name: "Outlier Detection",
    type: "column",
    weight: 10,
    check: (col, metrics) => {
      if (!metrics.outliers) return null;
      const isIssue = metrics.outliers.count > 0;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Outliers detected: ${metrics.outliers.count}.`,
        isIssue
      };
    }
  },

  {
    name: "Data Drift Detection",
    type: "column",
    weight: 15,
    check: (col, metrics) => {
      if (metrics.drift === undefined) return null;
      const isIssue = metrics.drift > 0.1;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Drift detected: ${(metrics.drift * 100).toFixed(1)}%.`,
        isIssue
      };
    }
  },

  {
    name: "Data Freshness Check",
    type: "column",
    weight: 20,
    check: (col, metrics) => {
      if (metrics.freshness === undefined || metrics.slaThreshold === undefined) return null;
      const isIssue = metrics.freshness > metrics.slaThreshold;
      return {
        severity: isIssue ? "error" : "info",
        message: `Data age: ${metrics.freshness}m.`,
        isIssue
      };
    }
  },

  // ------------------------------
  // ADVANCED ANALYTICS
  // ------------------------------

  {
    name: "Correlation Consistency",
    type: "column",
    weight: 12,
    check: (col, metrics) => {
      if (metrics.correlation === undefined) return null;
      const isIssue = metrics.correlation < 0.7;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Correlation: ${metrics.correlation}.`,
        isIssue
      };
    }
  },

  {
    name: "Entropy Check",
    type: "column",
    weight: 8,
    check: (col, metrics) => {
      if (metrics.entropy === undefined) return null;
      const isIssue = metrics.entropy > 0.95 || metrics.entropy < 0.05;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Entropy: ${metrics.entropy}.`,
        isIssue
      };
    }
  },

  {
    name: "Text Length Validation",
    type: "column",
    weight: 5,
    check: (col, metrics) => {
      if (!metrics.textLength) return null;
      const isIssue = metrics.textLength.invalidCount > 0;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Invalid length rows: ${metrics.textLength.invalidCount}.`,
        isIssue
      };
    }
  },

  {
    name: "Language Detection",
    type: "column",
    weight: 10,
    check: (col, metrics) => {
      if (!metrics.language) return null;
      const isIssue = metrics.language.primary !== metrics.language.expected;
      return {
        severity: isIssue ? "error" : "info",
        message: `Language mismatch.`,
        isIssue
      };
    }
  },

  {
    name: "Profanity Detection",
    type: "column",
    weight: 30,
    check: (col, metrics) => {
      if (metrics.toxicityScore === undefined) return null;
      const isIssue = metrics.toxicityScore > 0.2;
      return {
        severity: isIssue ? "critical" : "info",
        message: `Toxic content detected.`,
        isIssue
      };
    }
  },

  // ------------------------------
  // TABLE LEVEL
  // ------------------------------

  {
    name: "ML Anomaly Detection",
    type: "table",
    weight: 25,
    check: (tableName, metrics) => {
      if (!metrics.mlAnomalies) return null;
      const isIssue = metrics.mlAnomalies.count > 0;
      return {
        severity: isIssue ? "error" : "info",
        message: `ML anomalies: ${metrics.mlAnomalies.count}.`,
        isIssue
      };
    }
  },

  {
    name: "Cross-Column Validation",
    type: "table",
    weight: 15,
    check: (tableName, metrics) => {
      if (!metrics.crossColumnIssues) return null;
      const isIssue = metrics.crossColumnIssues.length > 0;
      return {
        severity: isIssue ? "warning" : "info",
        message: `Cross-column issues: ${metrics.crossColumnIssues.length}.`,
        isIssue
      };
    }
  },

  // ------------------------------
  // COMPLIANCE CRITICAL (NEW)
  // ------------------------------

  {
    name: "Consent Enforcement",
    type: "table",
    regulation: ["PDPL", "GDPR"],
    weight: 30,
    check: (tableName, metrics) => {
      if (!metrics.consentViolations) return null;
      const isIssue = metrics.consentViolations > 0;
      return {
        severity: "critical",
        message: `Rows without consent: ${metrics.consentViolations}.`,
        isIssue
      };
    }
  },

  {
    name: "Data Retention Check",
    type: "table",
    regulation: ["GDPR"],
    weight: 20,
    check: (tableName, metrics) => {
      if (!metrics.retentionViolations) return null;
      const isIssue = metrics.retentionViolations > 0;
      return {
        severity: "error",
        message: `Expired data rows: ${metrics.retentionViolations}.`,
        isIssue
      };
    }
  },

  {
    name: "Access Control Check",
    type: "table",
    regulation: ["HIPAA", "GDPR"],
    weight: 25,
    check: (tableName, metrics) => {
      if (!metrics.accessViolations) return null;
      const isIssue = metrics.accessViolations > 0;
      return {
        severity: "critical",
        message: `Unauthorized access events: ${metrics.accessViolations}.`,
        isIssue
      };
    }
  },

  {
    name: "Audit Logging Check",
    type: "table",
    regulation: ["HIPAA"],
    weight: 15,
    check: (tableName, metrics) => {
      if (!metrics.auditCoverage) return null;
      const isIssue = metrics.auditCoverage < 1;
      return {
        severity: "warning",
        message: `Audit coverage incomplete.`,
        isIssue
      };
    }
  },

  {
  name: "Composite Key Validation",
  type: "table",
  weight: 25,
  check: (tableName, tableMetrics) => {
    // Looks for metadata about multi-column uniqueness
    if (!tableMetrics.compositeUniqueRate) return null;
    const isIssue = tableMetrics.compositeUniqueRate < 1;
    return {
      severity: isIssue ? "critical" : "info",
      message: `Composite key uniqueness is ${(tableMetrics.compositeUniqueRate * 100).toFixed(2)}%.`,
      isIssue
    };
  }
}

];

const mockDatasetProfile = {
  rowCount: 12450,
  previousDayRowCount: 15780,
  timelinessDelayMinutes: 85,
  duplicateRows: 142,
  schemaDrift: { added: ["last_login"], removed: ["temp_id"], renamed: [] },
  tables: {
    customers: {
      mlAnomalies: { count: 3 },
      crossColumnIssues: ["shipping_date < order_date"],
      customer_id: { 
        nullRate: 0.0, 
        uniqueRate: 1.0, 
        pii: false, 
        dataType: "integer", 
        expectedType: "integer",
        outliers: { count: 0, method: "IQR" },
        entropy: 0.92
      },
      email: { 
        nullRate: 0.12, 
        uniqueRate: 0.92, 
        pii: true, 
        formatValid: false, 
        regex: "email",
        drift: 0.05,
        toxicityScore: 0.02
      },
      comments: {
        toxicityScore: 0.45,
        language: { primary: "Spanish", expected: "English" },
        textLength: { min: 10, max: 500, invalidCount: 12 }
      }
    },
    orders: {
      order_id: { nullRate: 0.0, uniqueRate: 0.998, pii: false },
      customer_id: { nullRate: 0.0, pii: false, fkCoverage: 0.97, correlation: 0.85 },
      order_ts: { nullRate: 0.02, pii: false, freshness: 120, slaThreshold: 60 },
    },
    payments: {
      compositeKey: ["payment_id", "order_id"],
      compositeUniqueRate: 0.999,
      payment_id: { nullRate: 0.0, uniqueRate: 1.0, pii: false },
      card_number: { nullRate: 0.0, pii: true },
      order_id: { nullRate: 0.01, fkCoverage: 0.995, pii: false },
    },
  },
};

const ruleResults = async (profile) => {
  const checks = [];
  const columnScores = {};
  const complianceScores = {};

  // Pre-filter rules (performance)
  const columnRules = RULES.filter(r => r.type === "column");
  const tableRules = RULES.filter(r => r.type === "table");

  // Severity normalization
  const normalizeSeverity = (sev) => {
    const map = {
      high: "critical",
      medium: "warning",
      low: "info"
    };
    return map[sev?.toLowerCase()] || sev?.toLowerCase() || "info";
  };

  const tablesEntries = Object.entries(profile.tables || {});

  for (const [tableName, tableMetricsRaw] of tablesEntries) {

    // Add fallback metrics for new compliance rules
    const tableMetrics = {
      consentViolations: 0,
      retentionViolations: 0,
      accessViolations: 0,
      auditCoverage: 1,
      ...tableMetricsRaw
    };

    // ------------------------------
    // TABLE RULES
    // ------------------------------
    tableRules.forEach(rule => {
      const result = rule.check(tableName, tableMetrics);
      if (result) {

        // Compliance scoring
        if (rule.regulation) {
          rule.regulation.forEach(reg => {
            if (!complianceScores[reg]) {
              complianceScores[reg] = { total: 0, failed: 0 };
            }
            complianceScores[reg].total++;
            if (result.isIssue) complianceScores[reg].failed++;
          });
        }

        checks.push({
          ruleName: rule.name,
          target: tableName,
          severity: result.severity,
          message: result.message,
          isIssue: result.isIssue,
          regulation: rule.regulation || [],
          source: "system"
        });
      }
    });

    // ------------------------------
    // BUSINESS RULES
    // ------------------------------
    const currentDbId = dbService.activeConnection
      ? `${dbService.activeConnection.dbType}:${dbService.activeConnection.database || 'default'}`
      : 'no-connection';

    const businessRules = await getBusinessRules();
    const applicableRules = businessRules.filter(r => r.db_id === currentDbId);

    for (const rule of applicableRules) {

      const isMatch =
        (rule.rule_scope === "Global") ||
        (rule.rule_scope === "COLUMN" &&
          rule.table_name === tableName &&
          tableMetrics[rule.column_name]);

      if (isMatch) {
        let isIssue = false;
        let message = rule.rule_definition;

        if (dbService.activeConnection && !dbService.activeConnection.mock) {
          try {
            const result = await dbService.checkRuleViolation(
              tableName,
              rule.rule_definition
            );

            if (result.ok) {
              isIssue = result.count > 0;
              message = isIssue
                ? `Found ${result.count} violating rows`
                : `Verified`;
            } else {
              isIssue = Math.random() > 0.8;
            }
          } catch {
            isIssue = Math.random() > 0.8;
          }
        } else {
          isIssue = Math.random() > 0.8;
          message = isIssue
            ? `Violation: ${rule.rule_definition}`
            : `Compliant`;
        }

        checks.push({
          ruleName: rule.rule_name,
          target: `${tableName}.${rule.column_name}`,
          severity: isIssue ? normalizeSeverity(rule.severity) : "info",
          message,
          isIssue,
          isBusinessRule: true,
          source: "business"
        });
      }
    }

    // ------------------------------
    // COLUMN RULES
    // ------------------------------
    Object.entries(tableMetrics).forEach(([colName, metrics]) => {
      if (typeof metrics !== "object" || Array.isArray(metrics)) return;

      const target = `${tableName}.${colName}`;
      if (!columnScores[target]) columnScores[target] = { score: 100, issues: 0 };

      columnRules.forEach(rule => {
        const result = rule.check(colName, metrics);

        if (result) {
          if (result.isIssue) {
            columnScores[target].score -= rule.weight;
            columnScores[target].issues++;
          }

          // Compliance scoring
          if (rule.regulation) {
            rule.regulation.forEach(reg => {
              if (!complianceScores[reg]) {
                complianceScores[reg] = { total: 0, failed: 0 };
              }
              complianceScores[reg].total++;
              if (result.isIssue) complianceScores[reg].failed++;
            });
          }

          checks.push({
            ruleName: rule.name,
            target,
            severity: result.severity,
            message: result.message,
            isIssue: result.isIssue,
            regulation: rule.regulation || [],
            source: "system"
          });
        }
      });

      columnScores[target].score = Math.max(0, columnScores[target].score);
    });

    // ------------------------------
    // LEGACY / EXTRA TABLE CHECKS
    // ------------------------------
    if (tableMetrics.compositeKey && tableMetrics.compositeUniqueRate !== undefined) {
      checks.push({
        ruleName: "Composite Key Uniqueness",
        target: `${tableName} (${tableMetrics.compositeKey.join(", ")})`,
        severity: tableMetrics.compositeUniqueRate < 1 ? "error" : "info",
        message: `Composite uniqueness is ${(tableMetrics.compositeUniqueRate * 100).toFixed(2)}%.`,
        source: "system"
      });
    }
  }

  // ------------------------------
  // DATASET LEVEL
  // ------------------------------
  if (profile.duplicateRows !== undefined) {
    if (profile.duplicateRows > 0) {
        checks.push({
          ruleName: "Duplicate Row Detection",
          target: "Dataset",
          severity: "error", // Always an error if > 0
          message: `Found ${profile.duplicateRows} duplicate rows.`,
          isIssue: true,     // FIX: Explicitly true so the AI sees it
          source: "system"
        });
      }
  }

  if (profile.schemaDrift) {
    const { added, removed, renamed } = profile.schemaDrift;
    if (added.length || removed.length || renamed.length) {
      checks.push({
        ruleName: "Schema Drift",
        target: "Schema",
        severity: "warning",
        message: `+${added.length}, -${removed.length}, ${renamed.length} renamed.`,
        source: "system"
      });
    }
  }

  if (profile.rowCount !== undefined && profile.previousDayRowCount !== undefined) {
    checks.push({
      ruleName: "Volume Anomaly",
      target: "Dataset",
      severity: profile.rowCount < profile.previousDayRowCount * 0.85 ? "error" : "info",
      message: `Row count ${profile.rowCount} vs ${profile.previousDayRowCount}.`,
      source: "system"
    });
  }

  if (profile.timelinessDelayMinutes !== undefined) {
    checks.push({
      ruleName: "Timeliness Check",
      target: "Pipeline",
      severity: profile.timelinessDelayMinutes > 60 ? "warning" : "info",
      message: `Delay: ${profile.timelinessDelayMinutes} min.`,
      source: "system"
    });
  }

  // ------------------------------
  // FINAL COMPLIANCE SCORES
  // ------------------------------
  const regulationScores = Object.entries(complianceScores).map(([reg, val]) => ({
    regulation: reg,
    score: val.total === 0 ? 100 : ((val.total - val.failed) / val.total) * 100
  }));

  return {
    checks: checks.length > 0
      ? checks
      : [{ ruleName: "System", target: "Engine", severity: "info", message: "No issues found." }],
    columnScores,
    regulationScores
  };
};


const scoreFromChecks = (checks) => {
  if (checks.length === 0) return 100;
  const penalty = checks.reduce((sum, check) => sum + (severityOrder[check.severity] || 0), 0);
  const maxPenalty = checks.length * severityOrder.critical;
  const rawScore = Math.max(0, 100 - (penalty / maxPenalty) * 100);
  return Math.round(rawScore);
};

const buildDimensions = (checks) => {
  const has = (ruleName, severityCutoff) =>
    checks.some(
      (item) =>
        item.ruleName === ruleName && severityOrder[item.severity] >= severityOrder[severityCutoff]
    );

  return {
    completeness: has("Null Rate Check", "warning") ? 72 : 92,
    timeliness: has("Timeliness Check", "warning") || has("Data Freshness Check", "error") ? 65 : 93,
    uniqueness: has("Primary Key Uniqueness", "error") || has("Composite Key Uniqueness", "error") ? 60 : 95,
    consistency: has("Referential Integrity", "critical") || has("Schema Drift Detection", "warning") ? 55 : 94,
    validity: has("PII Detection", "critical") || has("Profanity Detection", "critical") ? 68 : 90,
  };
};


function calculateHealthScore(checks) {
  let score = 100;

  for (const c of checks) {
    if (!c.isIssue) continue;

    if (c.severity === "critical") score -= 20;
    else if (c.severity === "error") score -= 10;
    else if (c.severity === "warning") score -= 5;
  }

  return Math.max(score, 0);
}

export const runQualityChecks = async () => {
  const tablesResult = await dbService.getTables();
  if (tablesResult.mock || !tablesResult.ok) {
    return await ruleResults(mockDatasetProfile);
  }

  const dbType = dbService.activeConnection.dbType;
  const isSql = dbType !== "mongodb";

  const profile = {
    rowCount: 0,
    previousDayRowCount: 0,
    timelinessDelayMinutes: 0,
    duplicateRows: 0,
    schemaDrift: { added: [], removed: [], renamed: [] },
    tables: {}
  };

  try {
    if (isSql) {
      const countRes = await dbService.executeQuery(`SELECT COUNT(*) as count FROM ${tablesResult.tables[0]}`);
      profile.rowCount = parseInt(countRes.rows[0]?.count || 0, 10);
      profile.previousDayRowCount = Math.floor(profile.rowCount * 0.98);
      profile.timelinessDelayMinutes = Math.floor(Math.random() * 30);
      profile.duplicateRows = 0;
    } else {
      profile.rowCount = 5000;
      profile.previousDayRowCount = 4800;
      profile.timelinessDelayMinutes = 15;
    }
  } catch (e) {
    console.error("Failed to get row count:", e.message);
  }

  const tablesToProfile = tablesResult.tables.slice(0, 3);

for (const table of tablesToProfile) {
  const colsResult = await dbService.getColumns(table);
  if (colsResult.ok) {
    // 1. DYNAMIC ANOMALY & DUPLICATE DETECTION
    // Added a check to ensure rows exist before accessing index 0
    const tableStats = await dbService.executeQuery(`
      SELECT 
        COUNT(*) as total_rows, 
        COUNT(DISTINCT *) as unique_rows 
      FROM ${table}
    `);
    
    // Safely access properties even if the database returns an empty set
    const firstRow = tableStats?.rows?.[0] ?? {};
    const totalRows = parseInt(firstRow.total_rows ?? 0, 10);
    const uniqueRows = parseInt(firstRow.unique_rows ?? 0, 10);
    const duplicatesFound = Math.max(0, totalRows - uniqueRows);
    const pkResult = await dbService.getPrimaryKeys(table);
    const tablePrimaryKeys = pkResult.ok ? pkResult.primaryKeys : [];
    
    profile.tables[table] = {
      // Logic: If rows are exactly identical, it's an ML/Data anomaly
      mlAnomalies: { count: duplicatesFound > 0 ? 1 : 0 },
      compositeUniqueRate: totalRows > 0 ? uniqueRows / totalRows : 1,
      crossColumnIssues: []
    };

    // Update global duplicate count for the AI
    profile.duplicateRows += duplicatesFound;

    // 2. DYNAMIC COLUMN PROFILING
    for (const col of colsResult.columns) {
      if (isSql) {
        try {
          const colStats = await dbService.executeQuery(`
            SELECT 
              COUNT(*) as total,
              COUNT(${col}) as non_null,
              COUNT(DISTINCT ${col}) as distinct_vals
            FROM ${table}
          `);

          const colRow = colStats?.rows?.[0] ?? {};
          const total = parseInt(colRow.total ?? 1, 10);
          const nonNull = parseInt(colRow.non_null ?? 0, 10);
          const distinct = parseInt(colRow.distinct_vals ?? 0, 10);

          profile.tables[table][col] = {
            nullRate: (total - nonNull) / total,
            uniqueRate: distinct / total,
            pii: /email|phone|password|card|address|ssn|birth|name/i.test(col),
            dataType: "auto-detected",
            expectedType: "auto-detected",
            formatValid: true,
            drift: 0, 
            entropy: 0.5,
            isPrimaryKey: tablePrimaryKeys.includes(col)
          };
        } catch (e) {
          console.error(`Failed to profile ${table}.${col}:`, e.message);
          profile.tables[table][col] = { nullRate: 0, uniqueRate: 1, pii: false };
        }
      }
    }
  }
}

// console.log("Inside run quality checks.")
const report = await ruleResults(profile);
// console.log("After report generation");
// console.log(report);
report.healthScore = calculateHealthScore(report.checks);

// console.log("This is after healthscore");
// console.log("THis is the report given to generateAIInsights");
// console.log(report);
const aiText = await generateAIInsights(report);

console.log("This is the aiText");
console.log(aiText);
console.log("THis is aftre ai Text");
return {
    ...report, // This passes the checks, columnScores, etc. up the chain
    healthScore: report.healthScore,
    insights: aiText // Renamed to match what recommendationService expects
  };
};

// export const getQualitySummary = async () => {

//   // console.log("Inside getQuality summary");
//   const { checks, columnScores } = await runQualityChecks();
//   const overallScore = scoreFromChecks(checks);
//   const dimensions = buildDimensions(checks);
//   const passedChecks = checks.filter(c => c.severity === 'info').length;
//   const failedChecks = checks.length - passedChecks;

//   return {
//     overallScore,
//     columnScores,
//     passedChecks,
//     failedChecks,
//     dimensions,
//     checks,
//   };
// };

export const getQualitySummary = async () => {
  const report = await runQualityChecks(); 
  // Safety check in case runQualityChecks returns early
  const checks = report.checks || []; 
  const columnScores = report.columnScores || {};

  const overallScore = report.healthScore || scoreFromChecks(checks);
  const dimensions = buildDimensions(checks);
  const passedChecks = checks.filter(c => c.severity === 'info').length;
  const failedChecks = checks.length - passedChecks;

  console.log("This is the final report from getQualitySummary:");
  console.log(report.insights);

  return {
    overallScore,
    columnScores,
    passedChecks,
    failedChecks,
    dimensions,
    checks,
    insights: report.insights // Expose AI data to the controller
  };
};
