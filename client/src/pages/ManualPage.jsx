import Card from "../components/Card";
import { 
  BookOpen, 
  Settings, 
  Activity, 
  HelpCircle, 
  CheckCircle2, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  Monitor,
  Search,
  Lock,
  Zap,
  Layers,
  FileSearch,
  Hash,
  RefreshCw,
  Clock,
  LayoutGrid,
  BarChart,
  History,
  TrendingUp,
  Brain,
  MessageSquare,
  Globe,
  Scissors,
  Eye,
  Workflow,
  Link,
  Target,
  FileCode,
  AlertCircle,
  Sparkles
} from "lucide-react";

function ManualPage() {
  const steps = [
    { title: "Connect Source", desc: "Add your database connection (PostgreSQL, MySQL, or MongoDB) in the 'Connections' tab.", icon: Database },
    { title: "Define Business Rules", desc: "Set up 'Custom Business Rules' globally or for specific columns to match your business logic.", icon: Workflow },
    { title: "Review AI Insights", desc: "Check the 'Dashboard' and 'AI Recommendations' for proactive fixes and agent-led analysis.", icon: Brain },
    { title: "Execute Queries", desc: "Use the 'Query Explorer' to run read-only SQL and further investigate findings.", icon: Search }
  ];

  const tests = [
    { 
      name: "Custom Business Rules", 
      icon: LayoutGrid, 
      howItHelps: "Allows you to define domain-specific rules (e.g., price > 0) either for a specific column or globally across all tables.",
      importance: "Ensures that data doesn't just meet technical standards, but also complies with your unique business logic."
    },
    { 
      name: "Autonomous AI Agent", 
      icon: Sparkles, 
      howItHelps: "Provides a conversational interface to ask complex questions about your data health and schema.",
      importance: "Reduces the time to find insights by allowing natural language queries instead of manual data exploration."
    },
    { 
      name: "PII Detection", 
      icon: Lock, 
      howItHelps: "Automatically identifies columns containing sensitive personal data like emails, phone numbers, and names.",
      importance: "Critical for GDPR/CCPA compliance and preventing accidental exposure of customer data."
    },
    { 
      name: "Null Rate Analysis", 
      icon: Activity, 
      howItHelps: "Measures the percentage of empty values in your critical business columns.",
      importance: "Ensures data completeness, preventing errors in reporting and downstream applications."
    },
    { 
      name: "Primary Key Uniqueness", 
      icon: Zap, 
      howItHelps: "Validates that unique identifiers are truly unique and not duplicated.",
      importance: "Prevents data corruption, join errors, and ensures reliable record identification."
    },
    { 
      name: "Referential Integrity", 
      icon: Link, 
      howItHelps: "Checks if foreign key relationships are maintained across related tables.",
      importance: "Ensures logical consistency between datasets and prevents 'orphan' records."
    },
    { 
      name: "Duplicate Row Detection", 
      icon: Layers, 
      howItHelps: "Identifies exact duplicate rows across the entire dataset.",
      importance: "Prevents inflated metrics and inaccurate reporting caused by redundant data."
    },
    { 
      name: "Correlation Consistency", 
      icon: TrendingUp, 
      howItHelps: "Monitors statistical correlation between dependent columns to catch logical anomalies.",
      importance: "Detects hidden data entry errors where values don't move together as expected (e.g., Price vs. Tax)."
    },
    { 
      name: "ML Anomaly Detection", 
      icon: Brain, 
      howItHelps: "Uses machine learning models to identify complex multivariate outliers that standard rules miss.",
      importance: "Catches sophisticated data issues that don't violate simple threshold rules."
    },
    { 
      name: "Profanity & Toxicity", 
      icon: MessageSquare, 
      howItHelps: "Scans text columns for inappropriate, offensive, or toxic content.",
      importance: "Protects brand reputation and ensures user-generated content meets safety standards."
    },
    { 
      name: "Language Verification", 
      icon: Globe, 
      howItHelps: "Detects the primary language of text and flags rows that don't match the expected locale.",
      importance: "Crucial for international applications and standardized NLP processing."
    },
    { 
      name: "Entropy & Cardinality", 
      icon: BarChart, 
      howItHelps: "Measures data randomness and the number of unique values in a column.",
      importance: "Detects data 'staling' where values become too repetitive or unexpectedly diverse."
    },
    { 
      name: "Cross-Column Validation", 
      icon: Workflow, 
      howItHelps: "Validates business logic rules that span multiple columns (e.g., ShipDate > OrderDate).",
      importance: "Ensures business process integrity and logical flow of information."
    },
    { 
      name: "Schema Drift Detection", 
      icon: RefreshCw, 
      howItHelps: "Monitors and alerts on structural changes like added, removed, or renamed columns.",
      importance: "Prevents downstream failures in ETL processes and reporting dashboards."
    },
    { 
      name: "Data Freshness (SLA)", 
      icon: Clock, 
      howItHelps: "Monitors data age against strict SLA thresholds to ensure real-time availability.",
      importance: "Critical for operational dashboards and time-sensitive decision-making."
    },
    { 
      name: "Masking & Encryption", 
      icon: Eye, 
      howItHelps: "Verifies if sensitive columns are properly masked or encrypted in the source.",
      importance: "Ensures security policies are actually being enforced at the database level."
    },
    { 
      name: "Weighted Scoring", 
      icon: Target, 
      howItHelps: "Calculates health scores where critical columns and tests impact the score more heavily.",
      importance: "Provides a more accurate reflection of data health by prioritizing what matters most."
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 py-4">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <BookOpen size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            DataGuard User Manual
          </h2>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            A comprehensive guide to DataGuard's intelligent monitoring engine.
          </p>
        </div>
      </div>

      {/* How to use */}
      <Card title="Quick Start Guide" subtitle="Get up and running with DataGuard in minutes.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 py-4">
          {steps.map((step, i) => (
            <div key={i} className="relative space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon size={20} />
              </div>
              <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{step.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 -right-3 text-muted">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Methodology Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Weighted Scoring System" icon={Target}>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            Our scoring engine isn't just a simple average. It uses a <strong>Weighted Penalty System</strong>:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-error" />
              <span style={{ color: "var(--text-primary)" }}>Critical (PII, Type Mismatch): -25 pts</span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-warning" />
              <span style={{ color: "var(--text-primary)" }}>Warning (Null Rate, Drift): -15 pts</span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-info" />
              <span style={{ color: "var(--text-primary)" }}>Info (Standard checks): 0 pts</span>
            </li>
          </ul>
        </Card>
        <Card title="AI-Powered Monitoring" icon={Brain}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Beyond standard SQL checks, DataGuard leverages ML-based anomaly detection to find "unknown unknowns". 
            The engine automatically learns your data's baseline distribution and flags shifts that traditional rules might miss.
          </p>
        </Card>
      </div>

      {/* What tests happen & Importance */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-1" style={{ color: "var(--text-primary)" }}>
          Intelligent Test Catalog
        </h3>
        <div className="grid gap-4">
          {tests.map((test, i) => (
            <Card key={i}>
              <div className="grid md:grid-cols-[220px_1fr_1fr] gap-6 items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-toggle text-primary">
                    <test.icon size={18} />
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{test.name}</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                    <HelpCircle size={12} />
                    How it helps
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {test.howItHelps}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-error">
                    <ShieldCheck size={12} className="text-error" />
                    Why it's important
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {test.importance}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary Note */}
      <div 
        className="rounded-2xl border-2 border-dashed p-8 text-center space-y-3"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-subtle)" }}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
          <CheckCircle2 size={24} />
        </div>
        <h4 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Automated Trust in Data
        </h4>
        <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          DataGuard runs these tests automatically in the background. Our plug-in architecture allows for seamless 
          scaling of new rules without impacting performance.
        </p>
      </div>
    </div>
  );
}

export default ManualPage;
