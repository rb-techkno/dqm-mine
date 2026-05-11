import { useState, useEffect, useRef } from "react";
import Card from "../components/Card";
import QualityLineChart from "../components/QualityLineChart";
import SeverityDonutChart from "../components/SeverityDonutChart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getDashboardMetrics } from "../api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown } from "lucide-react";
import useExportPDF from "../hooks/useExportPDF";

// Import Chart.js and DataLabels for headless PDF generation
import { Chart, registerables } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register plugins
Chart.register(...registerables, ChartDataLabels);

function DashboardPageTest() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const reportRef = useRef(null);
  const { exporting, exportPDF } = useExportPDF();

    const handleExport = () =>
    exportPDF(reportRef, `monitoring-report-${Date.now()}.pdf`, "System Monitoring Report");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Utility to generate Base64 images purely in code
  const generateChartImage = (config, width = 800, height = 400) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Force white background for jsPDF compatibility
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Render the chart synchronously in memory
    new Chart(ctx, {
      ...config,
      options: {
        ...config.options,
        responsive: false, // Critical: Ignores missing DOM parent
        animation: false,  // Critical: Renders instantly
        devicePixelRatio: 2, // High resolution for PDF
      },
    });

    return canvas.toDataURL("image/png", 1.0);
  };

  const handleDownloadPdf = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Generate Line Chart Image with Numbers
    const lineChartLabels = metrics.qualityTrend.map((item) =>
      item.date ? new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }) : item.name
    );
    const lineChartImg = generateChartImage({
      type: "line",
      data: {
        labels: lineChartLabels,
        datasets: [{
          label: "Quality",
          data: metrics.qualityTrend.map((item) => item.quality),
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6, 182, 212, 0.2)",
          borderWidth: 3,
          fill: true,
          tension: 0.4, 
        }],
      },
      options: {
        scales: { y: { min: 70, max: 100 } },
        plugins: { 
          legend: { display: false },
          datalabels: {
            align: 'top',
            anchor: 'end',
            color: '#06b6d4',
            font: { weight: 'bold', size: 12 },
            offset: 4
          }
        },
      },
    });

    // 2. Generate Donut Chart Image with Numbers
    const donutChartImg = generateChartImage({
      type: "doughnut",
      data: {
        labels: ["Critical", "Error", "Warning", "Info"],
        datasets: [{
          data: [
            metrics.issuesBySeverity.critical || 0,
            metrics.issuesBySeverity.error || 0,
            metrics.issuesBySeverity.warning || 0,
            metrics.issuesBySeverity.info || 0,
          ],
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#3b82f6"],
          borderWidth: 2,
          borderColor: "#ffffff",
        }],
      },
      options: { 
        plugins: { 
          legend: { position: "right", labels: { font: { size: 14 } } },
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 16 },
            formatter: (value) => {
              return value > 0 ? value : ''; // Hide labels if 0
            }
          }
        } 
      },
    }, 600, 400); 

    // --- Build the PDF ---
    let currentY = 40;

    doc.setFontSize(18);
    doc.text("DataGuard Intelligence Report", 40, currentY);
    currentY += 30;

    autoTable(doc, {
      startY: currentY,
      head: [["Metric", "Value"]],
      body: [
        ["Overall Quality", `${metrics.overallQuality}%`],
        ["Critical Issues", metrics.criticalIssues],
        ["Minor Issues", metrics.minorIssues],
      ],
    });

    currentY = doc.lastAutoTable.finalY + 30;

    // Add Line Chart
    doc.setFontSize(14);
    doc.text("7-Day Quality Trend", 40, currentY);
    currentY += 15;
    
    const maxWidth = pageWidth - 80;
    const lineHeight = maxWidth * (400 / 800); 
    doc.addImage(lineChartImg, "PNG", 40, currentY, maxWidth, lineHeight);
    
    currentY += lineHeight + 40;

    // Add Donut Chart
    doc.text("Issue Severity Breakdown", 40, currentY);
    currentY += 15;
    
    const donutMaxHeight = 220;
    const donutWidth = donutMaxHeight * (600 / 400); 
    const donutX = 40 + (maxWidth - donutWidth) / 2; 
    
    doc.addImage(donutChartImg, "PNG", donutX, currentY, donutWidth, donutMaxHeight);

    doc.save("dataguard-report.pdf");
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-7">
      <div className="flex justify-end">
        <button onClick={handleExport} className="btn-ghost">
          <FileDown size={15} /> Download Report
        </button>
      </div>

<div ref={reportRef} style={{ background: "#f8f9fb" }}>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="7-Day Quality Trend">
          <QualityLineChart data={metrics.qualityTrend} />
        </Card>

        <Card title="Issue Severity Breakdown">
          <SeverityDonutChart data={metrics.issuesBySeverity} />
        </Card>
      </div>
      </div>
    </div>
  );
}

export default DashboardPageTest;