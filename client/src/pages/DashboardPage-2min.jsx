import { useState, useEffect, useRef } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import QualityLineChart from "../components/QualityLineChart";
import SeverityDonutChart from "../components/SeverityDonutChart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getDashboardMetrics, getQualityData } from "../api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Database,
  Table as TableIcon,
  Columns,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  FileDown,
} from "lucide-react";
import html2canvas from "html2canvas";
import QualityScoreDonut from "../components/QualityScoreDonut";
import QualityRadarChart from "../components/QualityRadarChart";

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  const pdfRef = useRef(null); // 👈 hidden PDF container

  function extractReportData(data) {
    return {
      criticalChecks: (data.checks || [])
        .filter((c) => c.severity === "critical")
        .map((c) => ({
          ruleName: c.ruleName,
          target: c.target,
          message: c.message,
        })),
      dimensions: data.dimensions || {},
      insights: {
        criticalIssues: data.insights?.criticalIssues || [],
      },
      overallScore: data.overallScore ?? data.healthScore ?? null,
    };
  }

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const result = await getDashboardMetrics();
      const data = await getQualityData();

      setMetrics(result);
      setQualityData(extractReportData(data));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchMetrics} />;

  const getSeverityStatus = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Needs Attention";
    return "Critical";
  };

  const handleDownloadPdf = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const extracted = qualityData;
    let currentY = 130;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 100, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("DataGuard Intelligence Report", 40, 45);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 65);

    // Charts (from hidden ref)
    await new Promise((r) => setTimeout(r, 500));

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const img = canvas.toDataURL("image/png");
    const imgWidth = pageWidth - 80;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    doc.addImage(img, "PNG", 40, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 30;

    // Table
    autoTable(doc, {
      startY: currentY,
      head: [["Metric", "Value"]],
      body: [
        ["Overall Score", `${extracted.overallScore}%`],
        ["Critical Issues", extracted.criticalChecks.length],
      ],
    });

    currentY = doc.lastAutoTable.finalY + 30;

    // Insights (FIXED)
    doc.setFontSize(14);
    doc.text("AI Insights", 40, currentY);

    currentY += 20;

    (extracted.insights.criticalIssues || []).forEach((item) => {
      const text = `${item.issue} (${item.target}) → ${item.fix}`;
      const split = doc.splitTextToSize(text, pageWidth - 120);

      const boxHeight = split.length * 10 + 12;

      if (currentY + boxHeight > pageHeight - 40) {
        doc.addPage();
        currentY = 40;
      }

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, currentY, pageWidth - 80, boxHeight, 6, 6, "F");

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(split, 50, currentY + 15);

      currentY += boxHeight + 12;
    });

    doc.save("report.pdf");
  };

  const stats = [
    { label: "Connected Sources", value: metrics.connectedSources, icon: Database },
    { label: "Tables", value: metrics.monitoredTables, icon: TableIcon },
    { label: "Columns", value: metrics.analyzedColumns, icon: Columns },
    { label: "Quality", value: metrics.overallQuality + "%", icon: ShieldCheck },
    { label: "Critical", value: metrics.criticalIssues, icon: AlertCircle },
    { label: "Warnings", value: metrics.minorIssues, icon: AlertTriangle },
    { label: "Insights", value: metrics.aiInsights.length, icon: Sparkles },
  ];

  return (
    <div className="space-y-7">
      <button onClick={handleDownloadPdf} className="btn-ghost">
        <FileDown size={14} /> Download
      </button>

      {/* UI Charts (clean) */}
      <div className="grid grid-cols-2 gap-4">
        <QualityLineChart data={metrics.qualityTrend} />
        <SeverityDonutChart data={metrics.issuesBySeverity} />
      </div>

      {/* Hidden PDF Content */}
      <div
        ref={pdfRef}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1200px",
          background: "#fff",
        }}
      >
        <QualityLineChart data={metrics.qualityTrend} />
        <SeverityDonutChart data={metrics.issuesBySeverity} />
        <QualityScoreDonut score={qualityData.overallScore} />
        <QualityRadarChart data={qualityData.dimensions} />
      </div>
    </div>
  );
}

export default DashboardPage;