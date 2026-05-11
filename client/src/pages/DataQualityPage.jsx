import { useState, useEffect } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import QualityScoreDonut from "../components/QualityScoreDonut";
import QualityRadarChart from "../components/QualityRadarChart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getQualityData } from "../api";

function DataQualityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getQualityData();

      console.log(result);
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!data) return null; // Add this guard clause

  const formattedRows = data.checks
    .sort((a, b) => {
      const order = { critical: 0, error: 1, warning: 2, low: 3, medium: 4, info: 5 };
      return (order[a.severity] ?? 99) - (order[b.severity] ?? 99);
    })
    .map(row => ({
      ...row,
      severity: (
        <Badge variant={row.severity}>
          {row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}
        </Badge>
      ),
      rule:(<span
    className={`font-medium ${
      row.isBusinessRule
        ? "text-orange-500 bg-orange-100 px-2 py-1 rounded"
        : "text-primary"
    }`}
  >
    {row.ruleName}
  </span>),
      target: <code className="text-xs text-orange-500 font-mono">{row.target}</code>,
      message: (
        <div className="flex items-center gap-2">
          {row.isIssue ? (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          )}
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{row.message}</span>
        </div>
      )
    }));

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card 
          title="Overall Quality Score" 
          subtitle="Ratio of passed vs failed validation rules."
          description="The overall quality score is calculated as a weighted percentage of successful data quality checks across all monitored data sources."
        >
          <QualityScoreDonut score={data.overallScore} />
        </Card>
        <Card 
          title="Quality Dimensions" 
          subtitle="Distribution across key data quality pillars."
          description="Quality dimensions evaluate data across six standard categories: Accuracy, Completeness, Consistency, Timeliness, Validity, and Uniqueness."
          tooltipAlign="right"
        >
          <QualityRadarChart data={data.dimensions} />
        </Card>
      </div>

      {/* Rules Table */}
      <Card 
        title="Data Quality Rules" 
        subtitle="Detailed findings and violations across datasets."
        description="List of specific data quality rules currently being monitored, including their target datasets, severity levels, and recent validation outcomes."
      >
        <Table
          columns={[
            { key: "rule", label: "Rule Name" },
            { key: "target", label: "Target" },
            { key: "severity", label: "Severity" },
            { key: "message", label: "Message" },
          ]}
          rows={formattedRows}
        />
      </Card>
    </div>
  );
}

export default DataQualityPage;
